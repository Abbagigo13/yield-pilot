import { network } from "hardhat";
import { parseEther, formatEther } from "viem";

const VAULT = "0xC1117e87618C5789734C43839F2F45800CB22796";
const NEW_AGENT = "0xbDc3B633ef5857Ea7Ed8600d835B142901679ebA";

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const [owner] = await viem.getWalletClients();
const vault = await viem.getContractAt("YieldVault", VAULT);

console.log("1/3 Setting agent...");
await publicClient.waitForTransactionReceipt({
  hash: await vault.write.setAgent([NEW_AGENT]),
});

console.log("2/3 Sending 0.1 test ETH for gas...");
await publicClient.waitForTransactionReceipt({
  hash: await owner.sendTransaction({ to: NEW_AGENT, value: parseEther("0.1") }),
});

console.log("3/3 Vault agent is now:", await vault.read.agent());
console.log("Agent ETH balance:", formatEther(await publicClient.getBalance({ address: NEW_AGENT })));