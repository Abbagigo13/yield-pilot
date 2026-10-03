import { network } from "hardhat";
import { parseEther } from "viem";

const USDC = "0x251bEa83FCf334a292Ac25006Acc3889e394587B";
const VAULT = "0xC1117e87618C5789734C43839F2F45800CB22796";
const AGENT = "0x2a9dda16f68c4e67a4a889b662be682c2e784454";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();
const wait = (hash: `0x${string}`) =>
  publicClient.waitForTransactionReceipt({ hash });

const vault = await viem.getContractAt("YieldVault", VAULT);
const usdc = await viem.getContractAt("MockERC20", USDC);

const owner = await vault.read.owner();
console.log("Vault owner:  ", owner);
console.log("Your wallet:  ", deployer.account.address);
if (owner.toLowerCase() !== deployer.account.address.toLowerCase()) {
  throw new Error("Your wallet is not the vault owner - stopping.");
}

console.log("1/5 Setting agent...");
await wait(await vault.write.setAgent([AGENT]));

console.log("2/5 Deploying two mock strategies (5% and 8% APY)...");
const stratA = await viem.deployContract("MockStrategy", [USDC, VAULT, 500n]);
const stratB = await viem.deployContract("MockStrategy", [USDC, VAULT, 800n]);

console.log("3/5 Whitelisting strategies...");
for (const s of [stratA, stratB]) {
  await wait(await vault.write.proposeStrategy([s.address]));
  await wait(await vault.write.activateStrategy([s.address]));
}

console.log("4/5 Minting 10,000 mUSDC to your wallet...");
await wait(await usdc.write.mint([deployer.account.address, parseEther("10000")]));

console.log("5/5 Done. Save these addresses:");
console.log("Strategy A (5% APY):", stratA.address);
console.log("Strategy B (8% APY):", stratB.address);
console.log("Agent:", await vault.read.agent());