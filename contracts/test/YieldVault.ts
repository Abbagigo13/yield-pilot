import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, toFunctionSelector, zeroAddress } from "viem";

const { viem } = await network.connect();

// Passes only if the call reverts with the given custom error name
async function expectRevert(promise: Promise<unknown>, errorName: string) {
  try {
    await promise;
  } catch (e: any) {
    const msg = [e?.message, e?.shortMessage, e?.details].map(String).join(" ");
    const selector = toFunctionSelector(`${errorName}()`);
    assert.ok(
      msg.includes(errorName) || msg.includes(selector),
      `Expected revert ${errorName}, got: ${msg.slice(0, 300)}`,
    );
    return;
  }
  assert.fail(`Expected revert ${errorName} but the call succeeded`);
}

async function setup(delay = 0n) {
  const [owner, agent, alice] = await viem.getWalletClients();
  const usdc = await viem.deployContract("MockERC20", ["Mock USD Coin", "mUSDC"]);
  const vault = await viem.deployContract("YieldVault", [
    usdc.address,
    owner.account.address,
    delay,
  ]);
  await vault.write.setAgent([agent.account.address]);

  const stratA = await viem.deployContract("MockStrategy", [usdc.address, vault.address, 500n]);
  const stratB = await viem.deployContract("MockStrategy", [usdc.address, vault.address, 800n]);

  if (delay === 0n) {
    for (const s of [stratA, stratB]) {
      await vault.write.proposeStrategy([s.address]);
      await vault.write.activateStrategy([s.address]);
    }
  }

  const amount = parseEther("1000");
  await usdc.write.mint([alice.account.address, amount]);
  await usdc.write.approve([vault.address, amount], { account: alice.account });

  const aliceDeposit = (amt: bigint) =>
    vault.write.deposit([amt], { account: alice.account });
  const agentOpts = { account: agent.account };

  return { owner, agent, alice, usdc, vault, stratA, stratB, aliceDeposit, agentOpts };
}

describe("YieldVault", () => {
  it("deposits and withdraws everything back (minus 1000 locked wei)", async () => {
    const { alice, usdc, vault, aliceDeposit } = await setup();
    await aliceDeposit(parseEther("1000"));
    assert.equal(await vault.read.totalAssets(), parseEther("1000"));

    const sh = await vault.read.shares([alice.account.address]);
    await vault.write.withdraw([sh], { account: alice.account });
    assert.equal(
      await usdc.read.balanceOf([alice.account.address]),
      parseEther("1000") - 1000n,
    );
  });

  it("only the agent can allocate", async () => {
    const { alice, vault, stratA, aliceDeposit } = await setup();
    await aliceDeposit(parseEther("1000"));
    await expectRevert(
      vault.write.allocate([stratA.address, parseEther("100")], { account: alice.account }),
      "NotAgent",
    );
  });

  it("enforces the 50% cap cumulatively", async () => {
    const { vault, stratA, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("500")], agentOpts);
    await expectRevert(
      vault.write.allocate([stratA.address, 1n], agentOpts),
      "ExceedsRiskLimit",
    );
  });

  it("rebalances between whitelisted strategies when APY improves", async () => {
    const { usdc, vault, stratA, stratB, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("400")], agentOpts);
    await vault.write.rebalance([stratA.address, stratB.address, parseEther("300")], agentOpts);
    assert.equal(await usdc.read.balanceOf([stratA.address]), parseEther("100"));
    assert.equal(await usdc.read.balanceOf([stratB.address]), parseEther("300"));
  });

  it("blocks rebalance when the APY gain is too small", async () => {
    const { vault, stratA, stratB, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("400")], agentOpts);
    await stratB.write.setApy([520n]); // only +0.20%, minimum is 0.50%
    await expectRevert(
      vault.write.rebalance([stratA.address, stratB.address, parseEther("100")], agentOpts),
      "ApyDeltaTooLow",
    );
  });

  it("blocks rebalance to a non-whitelisted strategy", async () => {
    const { usdc, vault, stratA, aliceDeposit, agentOpts } = await setup();
    const rogue = await viem.deployContract("MockStrategy", [usdc.address, vault.address, 9000n]);
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("400")], agentOpts);
    await expectRevert(
      vault.write.rebalance([stratA.address, rogue.address, parseEther("100")], agentOpts),
      "NotStrategy",
    );
  });

  it("withdraw pulls funds back from strategies", async () => {
    const { alice, usdc, vault, stratA, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("500")], agentOpts);
    const sh = await vault.read.shares([alice.account.address]);
    await vault.write.withdraw([sh], { account: alice.account });
    assert.equal(
      await usdc.read.balanceOf([alice.account.address]),
      parseEther("1000") - 1000n,
    );
  });

  it("yield raises the value of a user's shares", async () => {
    const { alice, usdc, vault, stratA, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("500")], agentOpts);
    await usdc.write.mint([stratA.address, parseEther("100")]); // simulated yield
    assert.equal(await vault.read.totalAssets(), parseEther("1100"));
    const bal = await vault.read.balanceOf([alice.account.address]);
    assert.ok(bal > parseEther("1099"));
  });

  it("new strategies must wait for the timelock", async () => {
    const { vault, stratA } = await setup(1000n);
    await vault.write.proposeStrategy([stratA.address]);
    await expectRevert(vault.write.activateStrategy([stratA.address]), "DelayNotElapsed");
  });

  it("cannot remove a strategy that still holds funds", async () => {
    const { vault, stratA, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("100")], agentOpts);
    await expectRevert(vault.write.removeStrategy([stratA.address]), "StrategyNotEmpty");
  });

  it("pause blocks deposits but not withdrawals", async () => {
    const { alice, vault, aliceDeposit } = await setup();
    await aliceDeposit(parseEther("500"));
    await vault.write.pause();
    await expectRevert(aliceDeposit(parseEther("1")), "EnforcedPause");
    const sh = await vault.read.shares([alice.account.address]);
    await vault.write.withdraw([sh], { account: alice.account });
  });

  it("emergencyExit pauses and pulls everything back to the vault", async () => {
    const { usdc, vault, stratA, aliceDeposit, agentOpts } = await setup();
    await aliceDeposit(parseEther("1000"));
    await vault.write.allocate([stratA.address, parseEther("500")], agentOpts);
    await vault.write.emergencyExit();
    assert.equal(await usdc.read.balanceOf([vault.address]), parseEther("1000"));
    assert.equal(await vault.read.paused(), true);
  });

  it("rejects the zero address as agent", async () => {
    const { vault } = await setup();
    await expectRevert(vault.write.setAgent([zeroAddress]), "ZeroAddress");
  });
});