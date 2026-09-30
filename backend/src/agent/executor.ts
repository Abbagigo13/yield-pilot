import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  parseUnits,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodTestnet } from "../chains.js";

const VAULT_ABI = parseAbi([
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function rebalance(address newStrategy, uint256 amount)",
  "function totalDeposits() view returns (uint256)",
  "function balances(address) view returns (uint256)",
  "function asset() view returns (address)",
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

/* ---------------- Setup ---------------- */

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RH_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.USDC_ADDRESS as `0x${string}`;

if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY missing in .env");
if (!VAULT_ADDRESS) throw new Error("VAULT_ADDRESS missing in .env");
if (!USDC_ADDRESS) throw new Error("USDC_ADDRESS missing in .env");

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  chain: robinhoodTestnet,
  transport: http(RPC_URL),
  account,
});

export function getAgentAddress(): `0x${string}` {
  return account.address;
}

/* ---------------- Reads ---------------- */

export async function getAgentBalances() {
  const [ethBalance, usdcBalance, usdcDecimals] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    }),
    publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "decimals",
    }),
  ]);

  return {
    eth: Number(formatUnits(ethBalance, 18)),
    usdc: Number(formatUnits(usdcBalance, usdcDecimals)),
  };
}

/* ---------------- Approve + Deposit ---------------- */

export async function approveUsdc(amount: number) {
  const decimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const parsed = parseUnits(amount.toString(), decimals);
  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [VAULT_ADDRESS, parsed],
  });

  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function deposit(amount: number, userAddress: `0x${string}`) {
  // Note: for demo, the agent deposits on behalf of itself.
  // In production, users deposit themselves via the frontend.
  const decimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const parsed = parseUnits(amount.toString(), decimals);

  const hash = await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [parsed],
  });

  return await publicClient.waitForTransactionReceipt({ hash });
}

export async function withdraw(amount: number, userAddress: `0x${string}`) {
  const decimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const parsed = parseUnits(amount.toString(), decimals);

  const hash = await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "withdraw",
    args: [parsed],
  });

  return await publicClient.waitForTransactionReceipt({ hash });
}

/* ---------------- Rebalance ---------------- */

export async function rebalance(
  newStrategyAddress: `0x${string}`,
  amount: number
) {
  const decimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const parsed = parseUnits(amount.toString(), decimals);

  const hash = await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "rebalance",
    args: [newStrategyAddress, parsed],
  });

  return await publicClient.waitForTransactionReceipt({ hash });
}