import express from "express";
import cors from "cors";
import { chat } from "../agent/qwen.js";
import {
  getStrategies,
  getBestYield,
  getOnChainPortfolio,
} from "../agent/scanner.js";
import {
  getAgentAddress,
  getAgentBalances,
  rebalance,
} from "../agent/executor.js";

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
      res.json({
        totalDeposited: portfolio.totalDeposits,
        totalEarnings: 0, // TODO: compute from history
        currentApy: 5.42,
        activeStrategy: "Aave V3",
        change24h: 0.84,
        allocation: [
          { name: "Aave V3", value: 45, color: "#00ffa3" },
          { name: "Compound V3", value: 30, color: "#00d4ff" },
          { name: "Uniswap V3", value: 15, color: "#a855f7" },
          { name: "Radiant", value: 10, color: "#ff2d92" },
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
      res.json({
        active: true,
        lastRebalance: Date.now() - 2 * 60 * 60 * 1000,
        decisionsCount: 47,
        uptimeHours: 312,
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
    res.json([
      {
        id: "log-1",
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        type: "rebalance",
        message: "Moved 15% USDC from Compound → Aave (APY diff +0.4%)",
      },
      {
        id: "log-2",
        timestamp: Date.now() - 6 * 60 * 60 * 1000,
        type: "scan",
        message: "Scanned 12 yield opportunities across 4 protocols",
      },
      {
        id: "log-3",
        timestamp: Date.now() - 14 * 60 * 60 * 1000,
        type: "risk",
        message: "Detected ETH/USDC impermanent loss above threshold, reduced exposure",
      },
      {
        id: "log-4",
        timestamp: Date.now() - 26 * 60 * 60 * 1000,
        type: "rebalance",
        message: "Increased Uniswap V3 allocation by 5% (fees up 22%)",
      },
      {
        id: "log-5",
        timestamp: Date.now() - 48 * 60 * 60 * 1000,
        type: "info",
        message: "Agent initialized with balanced risk profile",
      },
    ]);
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
          // For demo: don't auto-execute, just log intent
          toolResult = {
            status: "pending_confirmation",
            intent: call.arguments,
          };
        }
      }

      res.json({
        role: "agent",
        content: reply.content || "I've analyzed the options. Check the results below.",
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

  app.get("/api/history/:address", (_req, res) => {
    res.json([
      {
        id: "tx-1",
        type: "deposit",
        amount: 5000,
        asset: "USDC",
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        txHash: "0xabc123...def456",
      },
      {
        id: "tx-2",
        type: "rebalance",
        amount: 1200,
        asset: "USDC",
        from: "Compound V3",
        to: "Aave V3",
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        txHash: "0x789ghi...012jkl",
      },
    ]);
  });

  return app;
}