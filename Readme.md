

```markdown
# Yield Pilot

> **AI-powered yield optimization on Robinhood Chain (Arbitrum Orbit).**
> Autonomous agents that scan DeFi protocols, rebalance capital, and maximize yields — while you sleep.

[![Built for Arbitrum Founder House](https://img.shields.io/badge/Built%20for-Arbitrum%20Founder%20House%20Singapore-00ffa3)](https://arbitrum-singapore.hackquest.io/)
[![Chain](https://img.shields.io/badge/Chain-Robinhood%20Testnet%20(46630)-00d4ff)](#)
[![AI](https://img.shields.io/badge/AI-Qwen%20(Alibaba%20Cloud)-a855f7)](#)

---

## 📖 Overview

**Yield Pilot** is an AI agent that manages your DeFi yield strategy autonomously. Deposit USDC into the vault, set your risk tolerance, and let the agent continuously scan protocols like Aave, Compound, and Uniswap for the best risk-adjusted yield — rebalancing automatically when opportunities shift.

Built specifically for **Robinhood Chain**, an Arbitrum Orbit L2 designed for real-world assets and financial-grade products.

### The Problem

DeFi yields are volatile, fragmented across dozens of protocols, and require constant monitoring to stay optimal. Retail users miss out on 2–8% APY gains simply because they can't watch 15 dashboards 24/7.

### The Solution

An autonomous agent that:
- **Scans** all whitelisted protocols every few minutes
- **Reasons** about risk-adjusted returns using an LLM (Qwen)
- **Executes** rebalances on-chain with hard risk limits you control
- **Reports** every decision transparently in a real-time dashboard

---

## ✨ Features

### 🤖 Autonomous Yield Agent
- Continuous monitoring of Aave V3, Compound V3, Uniswap V3, and more
- Natural-language commands ("move to lower risk", "find best USDC yield")
- Transparent decision log with reasoning for every action
- Hard risk limits: max allocation per protocol, min APY delta to trigger rebalance

### 📊 Real-Time Dashboard
- Live portfolio stats (deposits, earnings, APY, active strategy)
- 3D network visualization of yield opportunities
- Allocation breakdown with animated bars
- Full transaction history with on-chain links
- Agent control panel (start/pause, adjust risk profile)

### 🔐 Non-Custodial by Design
- Users retain full control of their capital
- Withdraw anytime, no lockups
- Agent operates through a restricted controller role
- Risk limits enforced at the smart contract level

### ⛓️ Built on Robinhood Chain
- Native to Robinhood Chain testnet (Chain ID: 46630)
- Uses ETH as gas token
- Arbitrum Nitro stack for maximum EVM compatibility
- Deployable to Arbitrum One with minimal changes

---

## 🏗️ Architecture

```

┌─────────────────────────────────────────────────────────────┐
│                      Yield Pilot Stack                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │◄────►│   Backend    │◄────►│  Contracts   │
│  Vite/React  │      │ Node + Qwen  │      │   Solidity   │
└──────────────┘      └──────────────┘      └──────────────┘
│                     │                      │
│                     │                      │
3D Network            AI Reasoning           Yield Vault
Dashboard             Yield Scanner          Strategy Adapters
Wallet (wagmi)        viem execution         Risk Controller
│                     │                      │
└─────────────────────┼──────────────────────┘
│
┌──────▼──────┐
│  Robinhood  │
│    Chain    │
│  (Arbitrum) │
└─────────────┘

```

### Components

| Layer | Tech | Purpose |
|-------|------|---------|
| **Smart Contracts** | Solidity 0.8.24, Hardhat 3 | Yield vault, strategy adapters, agent controller |
| **Backend Agent** | Node.js, TypeScript, viem | Yield scanner, AI reasoning (Qwen), execution |
| **Frontend** | React 19, Vite, Three.js, wagmi | 3D dashboard, wallet, user controls |
| **AI** | Qwen (Alibaba Cloud DashScope) | Natural-language reasoning, decision support |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v22+ ([download](https://nodejs.org))
- **Git** ([download](https://git-scm.com))
- A wallet with testnet ETH (e.g., MetaMask)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR-USERNAME/yield-pilot.git
cd yield-pilot
```

2. Install Dependencies

```bash
# Contracts
cd contracts
npm install
cd ..

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

3. Configure Environment Variables

Create contracts/.env:

```env
RH_RPC_URL=https://rpc.testnet.chain.robinhood.com
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
```

Create backend/.env:

```env
RH_RPC_URL=https://rpc.testnet.chain.robinhood.com
PRIVATE_KEY=0xYOUR_TEST_WALLET_PRIVATE_KEY
DASHSCOPE_API_KEY=your_alibaba_cloud_api_key
QWEN_MODEL=qwen-plus
```

⚠️ Never commit .env files. They're already in .gitignore.

4. Run the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 — you should see the landing page with the 3D network animation.

5. Deploy the Contracts (optional)

```bash
cd contracts
npx hardhat ignition deploy ./ignition/modules/YieldVault.ts --network robinhoodTestnet
```

---

📁 Project Structure

```
yield-pilot/
├── contracts/                    # Solidity smart contracts (Hardhat 3)
│   ├── contracts/
│   │   └── YieldVault.sol        # Main vault + agent controller
│   ├── ignition/modules/         # Deployment scripts
│   ├── test/                     # Contract tests
│   └── hardhat.config.ts
│
├── backend/                      # AI agent + on-chain execution
│   ├── src/                      # TypeScript source
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React + Vite + Three.js
│   ├── src/
│   │   ├── components/           # Reusable UI + 3D network graph
│   │   ├── pages/                # Landing + Dashboard
│   │   ├── hooks/                # useWallet, useAgent, useYieldData
│   │   ├── utils/                # wagmi config, API, mock data
│   │   └── styles/               # Global CSS variables
│   └── index.html
│
└── yield-pilot.code-workspace    # VS Code multi-root workspace
```

---

🎨 Design System

Yield Pilot uses a futuristic DeFi aesthetic:

Token Value Usage
--bg-primary #0a0e17 Deep navy background
--accent-green #00ffa3 Primary CTA, success states
--accent-blue #00d4ff Secondary highlights
--accent-purple #a855f7 Accent gradients
--accent-pink #ff2d92 Warnings, alerts

· Typography: Inter (body) + Space Grotesk (display)
· Effects: Glassmorphism cards, neon glows, animated gradients
· Motion: Framer Motion for UI + React Three Fiber for 3D

---

🧠 How the AI Agent Works

1. Scan — Every N minutes, the agent fetches APYs and TVL from all whitelisted protocols via on-chain calls and APIs.
2. Reason — The current portfolio state and opportunities are passed to Qwen with a structured prompt. The LLM returns a decision (e.g., rebalance(from: Aave, to: Uniswap, amount: 500 USDC)).
3. Validate — The decision is validated against hard risk limits defined in the smart contract (max allocation per protocol, minimum APY delta, etc.).
4. Execute — If valid, the agent calls YieldVault.rebalance() with the appropriate parameters. The transaction is signed by the agent's wallet.
5. Report — Every decision is logged on-chain (event) and displayed in the dashboard with reasoning.

---

🗺️ Roadmap

✅ Phase 1 — Hackathon MVP (Current)

☑ 3D landing page with animated network graph
☑ Dashboard with portfolio, strategies, agent, history tabs
☑ YieldVault smart contract scaffold
☑ Mock data throughout frontend
☐ Deploy contracts to Robinhood Chain testnet
☐ Wire backend to Qwen for real AI decisions
☐ Real on-chain deposits/withdrawals

🔜 Phase 2 — Post-Hackathon

☐ Multi-asset vaults (ETH, WBTC, RWA tokens)
☐ More strategy adapters (GMX, Radiant, Pendle)
☐ Backtesting engine for strategy simulation
☐ Telegram/Discord bot for alerts
☐ Mobile app (React Native)

🔮 Phase 3 — Mainnet

☐ Robinhood Chain mainnet deployment
☐ Audit + bug bounty
☐ Governance token for strategy curation
☐ Institutional yield products

---

🧪 Testing

```bash
# Contracts
cd contracts
npx hardhat test

# Frontend
cd frontend
npm run lint
```

---

🤝 Contributing

This is a hackathon project, but contributions are welcome. Open an issue or submit a PR.

1. Fork the repo
2. Create a feature branch (git checkout -b feature/amazing-thing)
3. Commit your changes (git commit -m 'Add amazing thing')
4. Push to the branch (git push origin feature/amazing-thing)
5. Open a Pull Request

---

📜 License

MIT — see LICENSE for details.

---

🙏 Acknowledgements

· Arbitrum Foundation and Offchain Labs for the Founder House program
· Robinhood Chain for the L2 infrastructure
· Alibaba Cloud for Qwen API access
· OpenZeppelin for battle-tested contracts
· Vercel for the frontend tooling inspiration

---

📬 Contact

Built for Arbitrum Founder House Singapore 2026.

· Project Lead: [Your Name]
· Twitter: @yourhandle
· Email: you@example.com

---

<p align="center">
  <sub>Built with ⚡ during the Arbitrum Founder House Singapore Buildathon · October 2026</sub>
</p>
```

---