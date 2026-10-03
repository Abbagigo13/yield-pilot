import { network } from "hardhat";
import { parseEther, formatEther } from "viem";

const USDC = "0x251bEa83FCf334a292Ac25006Acc3889e394587B";
const VAULT = "0xC1117e87618C5789734C43839F2F45800CB22796";
const STRAT_A = "0x17c6bd28cec3752602d5cf5924097e0a0bf2f8f7";
const STRAT_B = "0x79ff5a115d0b7ad5b2daa939d64ee01a1599ecad";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [me] = await viem.getWalletClients();
const wait = (hash: `0x${string}`) =>
  publicClient.waitForTransactionReceipt({ hash });

const vault = await viem.getContractAt("YieldVault", VAULT);
const usdc = await viem.getContractAt("MockERC20", USDC);

const show = async (label: string) => {
  console.log("--- " + label);
  console.log("Vault idle:  ", formatEther(await usdc.read.balanceOf([VAULT])));
  console.log("Strategy A:  ", formatEther(await usdc.read.balanceOf([STRAT_A])));
  console.log("Strategy B:  ", formatEther(await usdc.read.balanceOf([STRAT_B])));
  console.log("Total assets:", formatEther(await vault.read.totalAssets()));
  console.log("My balance:  ", formatEther(await vault.read.balanceOf([me.account.address])));
};

console.log("Approving...");
await wait(await usdc.write.approve([VAULT, parseEther("1000")]));
console.log("Depositing 1000...");
await wait(await vault.write.deposit([parseEther("1000")]));
await show("after deposit");

console.log("Allocating 400 to Strategy A...");
await wait(await vault.write.allocate([STRAT_A, parseEther("400")]));
await show("after allocate");

console.log("Rebalancing 300 from A to B (5% -> 8% APY)...");
await wait(await vault.write.rebalance([STRAT_A, STRAT_B, parseEther("300")]));
await show("after rebalance");