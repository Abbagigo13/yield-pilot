import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { robinhoodTestnet } from "../chains.js";

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

const VAULT_ABI = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function getStrategies() view returns (address[])",
]);

const STRATEGY_ABI = parseAbi([
  "function apyBps() view returns (uint256)",
  "function totalAssets() view returns (uint256)",
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
    allocation: number;
};

const COLORS = ["#00ffa3", "#00d4ff", "#a855f7", "#ff2d92"];

export async function getStrategies(): Promise<Strategy[]> {
  const vaultAddress = process.env.VAULT_ADDRESS as `0x${string}`;
  const usdcAddress = process.env.USDC_ADDRESS as `0x${string}`;

  const [addresses, decimals, totalRaw] = await Promise.all([
    client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "getStrategies" }),
    client.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalAssets" }),
  ]);
  const total = Number(formatUnits(totalRaw, decimals));

  return Promise.all(
    addresses.map(async (address, i) => {
      const [apyBps, tvlRaw] = await Promise.all([
        client.readContract({ address, abi: STRATEGY_ABI, functionName: "apyBps" }),
        client.readContract({ address, abi: STRATEGY_ABI, functionName: "totalAssets" }),
      ]);
      const tvl = Number(formatUnits(tvlRaw, decimals));
      return {
        id: `mock-strategy-${i + 1}`,
        name: `Mock Strategy ${String.fromCharCode(65 + i)}`,
        asset: "USDC",
        apy: Number(apyBps) / 100,
        tvl,
        allocation: total > 0 ? +((tvl / total) * 100).toFixed(1) : 0,
        risk: "low" as const,
        address,
        color: COLORS[i % COLORS.length],
      };
    })
  );
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
        functionName: "totalAssets"
      }),
      client.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "balanceOf",
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

export async function getVaultState() {
  const vaultAddress = process.env.VAULT_ADDRESS as `0x${string}`;
  const usdcAddress = process.env.USDC_ADDRESS as `0x${string}`;

  const [totalRaw, decimals, strategies] = await Promise.all([
    client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalAssets" }),
    client.readContract({ address: usdcAddress, abi: ERC20_ABI, functionName: "decimals" }),
    getStrategies(),
  ]);

  const total = Number(formatUnits(totalRaw, decimals));
  const deployed = strategies.reduce((sum, s) => sum + s.tvl, 0);
  return { total, idle: Math.max(0, total - deployed), strategies };
}