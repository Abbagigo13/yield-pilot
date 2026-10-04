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

const EVENTS_ABI = parseAbi([
  "event Deposited(address indexed user, uint256 assets, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 assets, uint256 shares)",
  "event Allocated(address indexed strategy, uint256 amount)",
  "event Deallocated(address indexed strategy, uint256 amount)",
  "event Rebalanced(address indexed from, address indexed to, uint256 amount)",
]);

let cachedLogs: { at: number; logs: any[] } | null = null;

async function fetchVaultLogs(vault: `0x${string}`): Promise<any[]> {
  if (cachedLogs && Date.now() - cachedLogs.at < 30_000) return cachedLogs.logs;

  const latest = await client.getBlockNumber();
  const fallbackStart = latest > 1_500_000n ? latest - 1_500_000n : 0n;
  let from = process.env.VAULT_DEPLOY_BLOCK ? BigInt(process.env.VAULT_DEPLOY_BLOCK) : fallbackStart;
  let step = 50_000n;
  const all: any[] = [];

  while (from <= latest) {
    const to = from + step - 1n > latest ? latest : from + step - 1n;
    try {
      const part = await client.getLogs({
        address: vault,
        events: EVENTS_ABI,
        fromBlock: from,
        toBlock: to,
      });
      all.push(...part);
      from = to + 1n;
    } catch (e) {
      if (step <= 2_000n) throw e;
      step = step / 2n; // the RPC rejected the range, so retry with a smaller one
    }
  }

  cachedLogs = { at: Date.now(), logs: all };
  return all;
}

export async function getHistory(userAddress: string) {
  const vault = process.env.VAULT_ADDRESS as `0x${string}`;
  const usdc = process.env.USDC_ADDRESS as `0x${string}`;

  const [logs, decimals, strategies] = await Promise.all([
    fetchVaultLogs(vault),
    client.readContract({ address: usdc, abi: ERC20_ABI, functionName: "decimals" }),
    getStrategies().catch(() => [] as Strategy[]),
  ]);

  const nameOf = (addr: string) =>
    strategies.find((s) => s.address.toLowerCase() === addr.toLowerCase())?.name ??
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const me = userAddress.toLowerCase();
  const fmt = (v: bigint) => Number(formatUnits(v, decimals));

  // the user's own deposits and withdrawals, plus every agent move in the vault
  const relevant = logs.filter((l: any) =>
    l.eventName === "Deposited" || l.eventName === "Withdrawn"
      ? String(l.args.user).toLowerCase() === me
      : true
  );

  const blocks = [...new Set(relevant.map((l: any) => l.blockNumber as bigint))];
  const stamps = new Map<bigint, number>();
  await Promise.all(
    blocks.map(async (b) => {
      const blk = await client.getBlock({ blockNumber: b });
      stamps.set(b, Number(blk.timestamp) * 1000);
    })
  );

  return relevant
    .map((l: any) => {
      const base = {
        id: `${l.transactionHash}-${l.logIndex}`,
        asset: "USDC",
        timestamp: stamps.get(l.blockNumber) ?? 0,
        txHash: l.transactionHash,
      };
      switch (l.eventName) {
        case "Deposited":
          return { ...base, type: "deposit", amount: fmt(l.args.assets) };
        case "Withdrawn":
          return { ...base, type: "withdraw", amount: fmt(l.args.assets) };
        case "Allocated":
          return { ...base, type: "rebalance", amount: fmt(l.args.amount), from: "Idle funds", to: nameOf(l.args.strategy) };
        case "Deallocated":
          return { ...base, type: "rebalance", amount: fmt(l.args.amount), from: nameOf(l.args.strategy), to: "Idle funds" };
        default:
          return { ...base, type: "rebalance", amount: fmt(l.args.amount), from: nameOf(l.args.from), to: nameOf(l.args.to) };
      }
    })
    .sort((a: any, b: any) => b.timestamp - a.timestamp);
}