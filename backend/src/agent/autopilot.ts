import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getVaultState } from "./scanner.js";
import { decideAllocation } from "./qwen.js";
import { allocate, rebalance } from "./executor.js";

const EXECUTE = process.env.AUTOPILOT_EXECUTE === "true";
const INTERVAL_MS = (Number(process.env.AUTOPILOT_INTERVAL_SEC) || 60) * 1000;
const MAX_SHARE = 0.5; // same as the contract's 50% cap
const MIN_APY_DELTA = 0.5; // percentage points, same as the contract default
const MIN_MOVE = 1; // ignore moves under 1 USDC

let busy = false;

/* ---------------- Activity log (saved to disk) ---------------- */

export type LogEntry = {
  id: string;
  timestamp: number;
  type: "scan" | "rebalance" | "risk" | "info";
  message: string;
  txHash?: string;
};

const LOG_FILE = resolve(process.cwd(), "data", "autopilot-log.json");
const MAX_LOG = 500;
export const startedAt = Date.now();
let log: LogEntry[] = [];
try {
  log = JSON.parse(readFileSync(LOG_FILE, "utf8"));
} catch {
  log = [];
}

function addLog(type: LogEntry["type"], message: string, txHash?: string) {
  log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    message,
    txHash,
  });
  log = log.slice(0, MAX_LOG);
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
  } catch {
    /* logging must never crash the agent */
  }
}

export function getLog() {
  return log;
}

export function getStats() {
  const lastMove = log.find((l) => l.type === "rebalance");
  return {
    decisionsCount: log.length,
    lastRebalance: lastMove ? lastMove.timestamp : null,
  };
}

/* ---------------- One autopilot cycle ---------------- */

export async function runAutopilotOnce() {
  const state = await getVaultState();
  const d = await decideAllocation(state);
  console.log("[autopilot] Qwen proposed:", JSON.stringify(d));
    const why = d.reason ? ` Reason: ${String(d.reason).slice(0, 160)}` : "";

  if (d.action === "none") {
        addLog("scan", `Vault scanned: no move needed.${why}`);
    return;
  }

  const byAddr = new Map(state.strategies.map((s) => [s.address.toLowerCase(), s]));
  const to = byAddr.get(String(d.to).toLowerCase());
  const amount = Math.floor(Number(d.amountUsdc) * 100) / 100;
  const proposal = `${d.action} ${d.amountUsdc} USDC`;

  const fail = (msg: string) => {
    console.log("[autopilot] rejected:", msg);
    addLog("risk", `Blocked Qwen's proposal (${proposal}): ${msg}.${why}`);
  };

  if (!to) return fail("unknown destination strategy");
  if (!(amount >= MIN_MOVE)) return fail("amount too small or invalid");
  if (to.tvl + amount > state.total * MAX_SHARE + 0.001) return fail("would exceed the 50% cap");

  if (d.action === "allocate") {
    if (amount > state.idle) return fail("not enough idle funds");
    if (!EXECUTE) {
      console.log(`[autopilot] DRY RUN: would allocate ${amount} to ${to.name}`);
      addLog("info", `Dry run: would allocate ${amount} USDC to ${to.name}.${why}`);
      return;
    }
    const r = await allocate(to.address as `0x${string}`, amount);
    console.log(`[autopilot] allocated ${amount} to ${to.name}`);
    addLog("rebalance", `Allocated ${amount} USDC of idle funds to ${to.name}.${why}`, r.transactionHash);
    return;
  }

  if (d.action === "rebalance") {
    const from = byAddr.get(String(d.from).toLowerCase());
    if (!from || from.address === to.address) return fail("bad source strategy");
    if (amount > from.tvl) return fail("source strategy holds less than that");
    if (to.apy < from.apy + MIN_APY_DELTA) return fail("APY gain too small");
    if (!EXECUTE) {
      console.log(`[autopilot] DRY RUN: would move ${amount} from ${from.name} to ${to.name}`);
      addLog("info", `Dry run: would move ${amount} USDC from ${from.name} to ${to.name}.${why}`);
      return;
    }
    const r = await rebalance(from.address as `0x${string}`, to.address as `0x${string}`, amount);
    console.log(`[autopilot] rebalanced ${amount} from ${from.name} to ${to.name}`);
    addLog(
      "rebalance",
      `Moved ${amount} USDC from ${from.name} (${from.apy}% APY) to ${to.name} (${to.apy}% APY).${why}`,
      r.transactionHash
    );
    return;
  }

  fail("unknown action");
}

/* ---------------- Loop ---------------- */

export function startAutopilot() {
  console.log(`[autopilot] started (${EXECUTE ? "LIVE" : "dry run"}, every ${INTERVAL_MS / 1000}s)`);
  setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await runAutopilotOnce();
    } catch (e) {
      console.warn("[autopilot] error:", (e as Error).message);
      addLog("info", `Autopilot error: ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }, INTERVAL_MS);
}