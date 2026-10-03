import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys the full Yield Pilot stack:
 *  1. MockERC20 (USDC representation for testnet)
 *  2. YieldVault (takes the MockERC20 address as the asset)
 *
 * Usage:
 *   npx hardhat ignition deploy ./ignition/modules/DeployYieldStack.ts --network robinhoodTestnet
 */
const DeployYieldStack = buildModule("DeployYieldStack", (m) => {
  // 1. Deploy Mock USDC (6 decimals not enforced, but OK for tests)
  const usdc = m.contract("MockERC20", ["Mock USD Coin", "mUSDC"]);

  // 2. Deploy YieldVault — constructor(asset, owner, strategyDelay)
  // The deployer account becomes the initial owner
  const deployer = m.getAccount(0);
  // strategyDelay = 0 for testing; use 86400 (1 day) in production
  const vault = m.contract("YieldVault", [usdc, deployer, 0n]);

  return { usdc, vault };
});

export default DeployYieldStack;