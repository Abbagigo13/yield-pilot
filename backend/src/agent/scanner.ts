import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { robinhoodTestnet } from "../chains.js";

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

const VAULT_ABI = parseAbi([
  "function totalDeposits() view returns (uint256)",
  "function balances(address) view returns (uint256)",
  "function activeStrategy() view returns (address)",
]);

const client = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(process.env.RH_RPC_URL),
});

/* ---------------- Types ---------------- */

export type Strategy = {
  id: string;
  name: string;
  asset: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  address: string;
  color: string;
};

/* ---------------- Mock APYs (fallback until real protocols integrate) --- */

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "aave-usdc",
    name: "Aave V3",
    asset: "USDC",
    apy: 4.2,
    tvl: 1_250_000,
    risk: "low",
    address: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    color: "#00ffa3",
  },
  {
    id: "compound-usdc",
    name: "Compound V3",
    asset: "USDC",
    apy: 3.8,
    tvl: 820_000,
    risk: "low",
    address: "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
    color: "#00d4ff",
  },
  {
    id: "uniswap-eth-usdc",
    name: "Uniswap V3",
    asset: "ETH/USDC",
    apy: 12.5,
    tvl: 2_100_000,
    risk: "medium",
    address: "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443",
    color: "#a855f7",
  },
  {
    id: "radiant-usdc",
    name: "Radiant",
    asset: "USDC",
    apy: 6.1,
    tvl: 540_000,
    risk: "medium",
    address: "0x8E7a5A4B2c7c6aC7c7a2C7D9b0b0b0b0b0b0b0b0",
    color: "#ff2d92",
  },
];

/* ---------------- Public API ---------------- */

/**
 * Returns all whitelisted strategies with current APY.
 * Currently uses static APYs — hook up live protocol reads when available.
 */
export async function getStrategies(): Promise<Strategy[]> {
  // Add small random jitter every call to simulate live APY ticking
  return MOCK_STRATEGIES.map((s) => ({
    ...s,
    apy: +(s.apy + (Math.random() - 0.5) * 0.15).toFixed(2),
  }));
}

export async function getBestYield(asset = "USDC"): Promise<Strategy | null> {
  const strategies = await getStrategies();
  const matching = strategies.filter((s) => s.asset.includes(asset));
  if (matching.length === 0) return null;
  return matching.reduce((best, s) => (s.apy > best.apy ? s : best));
}

/* ---------------- On-chain reads ---------------- */

export async function getOnChainPortfolio(userAddress: `0x${string}`) {
  const vaultAddress = process.env.VAULT_ADDRESS as `0x${string}`;
  const usdcAddress = process.env.USDC_ADDRESS as `0x${string}`;

  if (!vaultAddress || !usdcAddress) {
    throw new Error("VAULT_ADDRESS or USDC_ADDRESS missing in .env");
  }

  const [totalDeposits, userBalance, walletBalance, decimals] =
    await Promise.all([
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "totalDeposits",
      }),
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "balances",
        args: [userAddress],
      }),
      client.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
      client.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

  const fmt = (v: bigint) => Number(formatUnits(v, decimals));

  return {
    totalDeposits: fmt(totalDeposits),
    userVaultBalance: fmt(userBalance),
    userWalletBalance: fmt(walletBalance),
  };
}