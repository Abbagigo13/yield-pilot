import express from "express";
import cors from "cors";
import { chat } from "../agent/qwen.js";
import {
  getStrategies,
  getBestYield,
  getOnChainPortfolio,
  getVaultState,
  getHistory,
} from "../agent/scanner.js";
import { getAgentAddress, getAgentBalances } from "../agent/executor.js";
import { getLog, getStats, startedAt } from "../agent/autopilot.js";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  /* ---------------- Health ---------------- */

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      agent: getAgentAddress(),
      timestamp: Date.now(),
    });
  });

  /* ---------------- Portfolio ---------------- */

  app.get("/api/portfolio/:address", async (req, res) => {
    try {
      const address = req.params.address as `0x${string}`;
      const portfolio = await getOnChainPortfolio(address);
      const state = await getVaultState();

      const blendedApy =
        state.total > 0
          ? state.strategies.reduce((sum, s) => sum + s.apy * s.tvl, 0) / state.total
          : 0;
      const biggest = [...state.strategies].sort((a, b) => b.tvl - a.tvl)[0];
      const pct = (v: number) =>
        state.total > 0 ? +((v / state.total) * 100).toFixed(1) : 0;

      res.json({
        totalDeposited: portfolio.totalDeposits,
        totalEarnings: 0,
        currentApy: +blendedApy.toFixed(2),
        activeStrategy: biggest && biggest.tvl > 0 ? biggest.name : "None",
        change24h: 0,
        allocation: [
          ...state.strategies.map((s) => ({
            name: s.name,
            value: pct(s.tvl),
            color: s.color,
          })),
          { name: "Idle", value: pct(state.idle), color: "#64748b" },
        ],
        onChain: portfolio,
      });
    } catch (e) {
      console.error("[portfolio]", e);
      res.status(500).json({ error: (e as Error).message });
    }
  });

  /* ---------------- Strategies ---------------- */

  app.get("/api/strategies", async (_req, res) => {
    try {
      const strategies = await getStrategies();
      res.json(strategies);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  /* ---------------- Agent status ---------------- */

  app.get("/api/agent/status", async (_req, res) => {
    try {
      const balances = await getAgentBalances();
      const stats = getStats();
      res.json({
        active: true,
        mode: process.env.AUTOPILOT_EXECUTE === "true" ? "live" : "dry-run",
        lastRebalance: stats.lastRebalance,
        decisionsCount: stats.decisionsCount,
        uptimeHours: +((Date.now() - startedAt) / 3_600_000).toFixed(1),
        riskTolerance: "balanced",
        maxPerStrategy: 50,
        agentAddress: getAgentAddress(),
        agentBalances: balances,
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get("/api/agent/logs", (_req, res) => {
    res.json(getLog().slice(0, 50));
  });

  app.post("/api/agent/start", (_req, res) => res.json({ ok: true }));
  app.post("/api/agent/stop", (_req, res) => res.json({ ok: true }));

  /* ---------------- Chat ---------------- */

  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message required" });
      }

      const reply = await chat(message);

      // If Qwen decided to call a tool, execute it
      let toolResult: unknown = null;

      if (reply.toolCalls && reply.toolCalls.length > 0) {
        const call = reply.toolCalls[0];

        if (call.name === "get_best_yield") {
          const asset = (call.arguments.asset as string) || "USDC";
          toolResult = await getBestYield(asset);
        } else if (call.name === "get_portfolio_status") {
          const addr = call.arguments.userAddress as `0x${string}`;
          toolResult = await getOnChainPortfolio(addr);
        } else if (call.name === "execute_rebalance") {
          // Chat never moves funds: only the autopilot does, after validation.
          toolResult = {
            status: "pending_confirmation",
            intent: call.arguments,
          };
        }
      }

      res.json({
        role: "agent",
                content: (reply.content || "I've analyzed the options. Check the results below.").replace(/\*\*/g, ""),
        toolCalls: reply.toolCalls,
        toolResult,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("[chat]", e);
      res.status(500).json({ error: (e as Error).message });
    }
  });

  /* ---------------- History ---------------- */

    app.get("/api/history/:address", async (req, res) => {
    try {
      res.json(await getHistory(req.params.address));
    } catch (e) {
      console.error("[history]", e);
      res.status(500).json({ error: (e as Error).message });
    }
  });

  return app;
}