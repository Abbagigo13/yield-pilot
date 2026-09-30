import { network } from "hardhat";

const USDC_ADDRESS = "0xDFE4295e2D13a09fAb84Eb244Df583a0af20a17f";
const RECIPIENT = "0x2A9DDA16F68c4e67A4A889B662Be682C2E784454";  // ← your wallet
const AMOUNT = 100_000_000n * 10n ** 18n;  // 100,000,000 mUSDC

async function main() {
  const { viem } = await network.connect();
  const usdc = await viem.getContractAt("MockERC20", USDC_ADDRESS);
  const tx = await usdc.write.mint([RECIPIENT, AMOUNT]);
  console.log("Minted 100,000,000 mUSDC");
  console.log("Tx hash:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});