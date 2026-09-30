import "dotenv/config";
import { createServer } from "./api/server.js";
import { getStrategies } from "./agent/scanner.js";
import { getAgentAddress, getAgentBalances } from "./agent/executor.js";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  console.log("🚀 Yield Pilot Backend starting...\n");

  // Log agent info
  const agent = getAgentAddress();
  console.log("🔑 Agent address:", agent);

  try {
    const balances = await getAgentBalances();
    console.log("💰 Agent ETH balance:", balances.eth.toFixed(6));
    console.log("💰 Agent USDC balance:", balances.usdc.toFixed(2));
  } catch (e) {
    console.warn("⚠️  Could not fetch agent balances:", (e as Error).message);
  }

  // Boot API
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`\n✅ API listening on http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health`);
    console.log(`   Chat:    POST http://localhost:${PORT}/api/agent/chat`);
    console.log("");
  });

  // Background scan loop (every 60s)
  setInterval(async () => {
    try {
      const strategies = await getStrategies();
      const best = strategies.reduce((a, b) => (a.apy > b.apy ? a : b));
      console.log(
        `[scan] ${new Date().toISOString()} — best: ${best.name} @ ${best.apy}%`
      );
    } catch (e) {
      console.warn("[scan] error:", (e as Error).message);
    }
  }, 60_000);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});