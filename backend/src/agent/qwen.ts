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

Available protocols: Aave V3, Compound V3, Uniswap V3, Radiant.

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