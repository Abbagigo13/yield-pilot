import "dotenv/config";
import OpenAI from "openai";

/**
 * Qwen via Alibaba Cloud DashScope.
 * DashScope exposes an OpenAI-compatible endpoint at:
 *   https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 */

const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-plus";

if (!DASHSCOPE_API_KEY) {
  console.warn("⚠️  DASHSCOPE_API_KEY is not set. AI features will fail.");
}

const client = new OpenAI({
  apiKey: DASHSCOPE_API_KEY,
  baseURL: DASHSCOPE_BASE_URL,
});

/* ------------------------------------------------------------------ */
/*  Tool definitions the agent can call                                */
/* ------------------------------------------------------------------ */

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_best_yield",
      description:
        "Get the current best yield opportunity across all whitelisted protocols.",
      parameters: {
        type: "object",
        properties: {
          asset: {
            type: "string",
            description: "The asset symbol, e.g. USDC or ETH/USDC",
          },
          riskLevel: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Optional risk filter",
          },
        },
        required: ["asset"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_portfolio_status",
      description: "Get the current state of the user's portfolio.",
      parameters: {
        type: "object",
        properties: {
          userAddress: {
            type: "string",
            description: "EVM address of the user",
          },
        },
        required: ["userAddress"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_rebalance",
      description:
        "Execute a rebalance between two yield strategies. Requires user confirmation.",
      parameters: {
        type: "object",
        properties: {
          fromProtocol: { type: "string" },
          toProtocol: { type: "string" },
          amount: {
            type: "string",
            description: "Amount in USDC (as a decimal string)",
          },
        },
        required: ["fromProtocol", "toProtocol", "amount"],
      },
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Chat function                                                      */
/* ------------------------------------------------------------------ */

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
};

export type AgentResponse = {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
};

const SYSTEM_PROMPT = `You are Yield Pilot, an autonomous DeFi yield optimization agent on Robinhood Chain (an Arbitrum Orbit L2).

Your job:
- Help users maximize risk-adjusted yield on their deposited USDC.
- Answer questions clearly and concisely.
- When asked to rebalance, ALWAYS call the execute_rebalance tool with explicit parameters.
- When asked about the best yield, call get_best_yield.
- When asked about a portfolio, call get_portfolio_status.

Available strategies: the whitelisted strategies returned by get_best_yield (currently two test strategies).

Risk guidelines:
- Never exceed 50% allocation to a single protocol.
- Prefer low-risk protocols for capital preservation requests.
- Explain decisions in plain English.

Keep responses under 120 words unless the user asks for detail.`;

export async function chat(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<AgentResponse> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model: QWEN_MODEL,
    messages: messages as never,
    tools: AGENT_TOOLS as never,
    tool_choice: "auto",
    temperature: 0.3,
  });

  const choice = response.choices[0];
  const msg = choice.message;

    const toolCalls = ((msg.tool_calls || []) as Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>).map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: (() => {
      try {
        return JSON.parse(tc.function.arguments);
      } catch {
        return {};
      }
    })(),
  }));

  return {
    content: msg.content || "",
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

export type VaultStateForAI = {
  total: number;
  idle: number;
  strategies: Array<{ address: string; name: string; apy: number; tvl: number }>;
};

export type Decision = {
  action: "none" | "allocate" | "rebalance";
  from?: string | null;
  to?: string | null;
  amountUsdc?: number;
  reason?: string;
};

export async function decideAllocation(state: VaultStateForAI): Promise<Decision> {
  const floor2 = (n: number) => Math.floor(n * 100) / 100;
  const capUsdc = floor2(state.total * 0.5);
  const strategies = state.strategies.map((s) => ({
    ...s,
    headroom: Math.max(0, floor2(capUsdc - s.tvl)),
  }));

  // Every move the vault rules would allow right now
  const validMoves: Array<{
    action: "allocate" | "rebalance";
    from: string | null;
    fromName: string;
    to: string;
    toName: string;
    maxUsdc: number;
    apyGainPoints: number;
  }> = [];

  for (const t of strategies) {
    if (t.headroom < 1) continue;

    const idleMax = floor2(Math.min(state.idle, t.headroom));
    if (idleMax >= 1) {
      validMoves.push({
        action: "allocate",
        from: null,
        fromName: "idle cash",
        to: t.address,
        toName: t.name,
        maxUsdc: idleMax,
        apyGainPoints: t.apy,
      });
    }

    for (const f of strategies) {
      if (f.address === t.address) continue;
      if (f.tvl < 1 || t.apy < f.apy + 0.5) continue;
      const max = floor2(Math.min(f.tvl, t.headroom));
      if (max >= 1) {
        validMoves.push({
          action: "rebalance",
          from: f.address,
          fromName: f.name,
          to: t.address,
          toName: t.name,
          maxUsdc: max,
          apyGainPoints: +(t.apy - f.apy).toFixed(2),
        });
      }
    }
  }

  if (validMoves.length === 0) {
    return { action: "none", reason: "No legal move available right now." };
  }

  const res = await client.chat.completions.create({
    model: QWEN_MODEL,
    temperature: 0,
    max_tokens: 250,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You manage a USDC yield vault. You are given validMoves, a list of every legal move. " +
          "Pick the ONE move with the largest apyGainPoints. " +
          "Reply with one json object only: " +
          '{"action":"allocate|rebalance","from":"0x... or null","to":"0x...","amountUsdc":number,"reason":"short"}. ' +
          "Copy action, from and to exactly from the chosen move. Set amountUsdc to that move's maxUsdc, never more. " +
          "reason: ONE sentence, max 20 words, naming the strategies and their APYs. No calculations. " +
          "Output the json object and nothing else.",
      },
      {
        role: "user",
        content: JSON.stringify({
          strategies: strategies.map((s) => ({
            name: s.name,
            apyPercent: s.apy,
            tvlUsdc: s.tvl,
          })),
          validMoves,
        }),
      },
    ],
  });

  try {
    return JSON.parse(res.choices[0].message.content || "{}") as Decision;
  } catch {
    return { action: "none", reason: "could not parse model output" };
  }
}