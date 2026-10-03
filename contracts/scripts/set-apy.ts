import { network } from "hardhat";

const STRATS: Record<string, `0x${string}`> = {
  A: "0x17c6bd28cec3752602d5cf5924097e0a0bf2f8f7",
  B: "0x79ff5a115d0b7ad5b2daa939d64ee01a1599ecad",
};

const which = (process.env.STRAT || "A").toUpperCase();
const bps = BigInt(process.env.APY_BPS || "1200");

const { viem } = await network.connect();
const publicClient = await viem.getPublicClient();
const strat = await viem.getContractAt("MockStrategy", STRATS[which]);

const hash = await strat.write.setApy([bps]);
await publicClient.waitForTransactionReceipt({ hash });
console.log(`Strategy ${which} APY is now ${Number(bps) / 100}%`);