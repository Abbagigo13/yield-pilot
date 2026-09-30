import "dotenv/config";
import { chat } from "./agent/qwen.js";

async function main() {
  console.log("Testing Qwen...\n");

  const r1 = await chat("What's the best USDC yield right now?");
  console.log("Q1:", r1.content);
  console.log("Tool calls:", r1.toolCalls);
  console.log("---");

  const r2 = await chat(
    "Rebalance 500 USDC from Compound to Aave to capture the higher yield."
  );
  console.log("Q2:", r2.content);
  console.log("Tool calls:", r2.toolCalls);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});