import { network } from "hardhat";

const USDC = "0x251bEa83FCf334a292Ac25006Acc3889e394587B";
const VAULT = "0xC1117e87618C5789734C43839F2F45800CB22796";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const wait = (hash: `0x${string}`) =>
  publicClient.waitForTransactionReceipt({ hash });

const vault = await viem.getContractAt("YieldVault", VAULT);
const strat = await viem.deployContract("MockStrategy", [USDC, VAULT, 1500n]);

await wait(await vault.write.proposeStrategy([strat.address]));
await wait(await vault.write.activateStrategy([strat.address]));
console.log("Strategy C (15% APY):", strat.address);