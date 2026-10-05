# Yield Pilot

**An AI agent that moves your USDC to the best yield, inside guardrails the smart contract enforces.**

Yield Pilot is a non-custodial yield vault on **Robinhood Chain** (an Arbitrum Orbit L2) with an autonomous agent attached. Users deposit USDC and get vault shares. The agent, powered by **Qwen**, watches the available strategies and decides where the money should sit. It can only move funds between strategies the owner has whitelisted, and it can never send funds to an arbitrary address. Every limit is enforced on-chain, so even a misbehaving AI cannot break the rules.

Built for the Arbitrum Founder House Singapore buildathon.

---

## Why it exists

Most "AI and DeFi" demos let a model hold keys and hope for the best. Yield Pilot takes the opposite approach: the model only proposes,the code and the contract decide.

- The AI is a **decision-maker, not a custodian**.
- Its permissions are narrow: allocate idle funds, move funds between whitelisted strategies, pull funds back.
- Its proposals are checked twice, once by the backend and once by the contract.

---

## How it works

```text
 Users ──deposit / withdraw──▶  YieldVault  ◀──allocate / rebalance──  Agent wallet
                                    │                                       ▲
                       ┌────────────┼────────────┐                          │
                       ▼            ▼            ▼                          │
                  Strategy A   Strategy B   Strategy C                      │
                                    ▲                                       │
                                    │ APY + TVL (on-chain reads)            │
   Scanner ─────────────────────────┘                                       │
      │                                                                     │
      ▼                                                                     │
   Backend computes every LEGAL move ──▶ Qwen picks the best one ──▶ Backend re-validates ─┘
```

Each autopilot cycle (every 60 seconds by default):

1. **Scan.** Read the vault's strategies, their APY and their balances from the chain.
2. **Compute.** The backend lists every move the vault rules would allow right now (cap headroom, APY gain, available balance).
3. **Decide.** Qwen picks the legal move with the biggest APY gain and explains it in one sentence. If no legal move exists, Qwen is not even called.
4. **Validate.** The backend re-checks the proposal against the same rules.
5. **Execute.** Only then does the agent send a transaction, and the contract checks the rules again.
6. **Log.** Every decision, including blocked ones, is written to an activity log with the transaction hash, and shown in the dashboard.

---

## Safety design

| Layer | What it enforces |
| --- | --- |
| **Smart contract** | Only whitelisted strategies. Max 50% of total assets per strategy (checked whenever funds are moved in). New rebalance must beat the old strategy's APY by at least 0.5 points. Agent role cannot withdraw to arbitrary addresses. |
| **Strategy timelock** | New strategies must be proposed, wait `strategyDelay`, then be activated. It is 0 on the testnet demo and meant to be 1 day in production. A strategy must be empty before it can be removed. |
| **Emergency controls** | `pause()` blocks deposits and agent moves (withdrawals stay open). `emergencyExit()` pauses and pulls every strategy back to the vault. Ownership transfer uses `Ownable2Step`. |
| **Accounting** | Share-based (ERC-4626 style) so yield accrues to depositors. 1,000 shares are locked forever to block the first-depositor inflation attack. Deposits credit the amount actually received. |
| **Backend** | Re-validates every proposal. A `AUTOPILOT_EXECUTE=false` switch runs the agent in dry-run mode (logs only). |
| **Chat** | The chat assistant can answer questions, but its `execute_rebalance` tool only returns a pending intent. Only the validated autopilot can move funds. |

You can see these in action: the activity log records proposals the code blocked, with the reason.

---

## Live deployment (Robinhood Chain testnet, chain ID 46630)

| Contract | Address |
| --- | --- |
| YieldVault | `0xC1117e87618C5789734C43839F2F45800CB22796` |
| MockERC20 (mUSDC) | `0x251bEa83FCf334a292Ac25006Acc3889e394587B` |
| Mock Strategy A | `0x17c6bd28cec3752602d5cf5924097e0a0bf2f8f7` |
| Mock Strategy B | `0x79ff5a115d0b7ad5b2daa939d64ee01a1599ecad` |
| Mock Strategy C | `0x51645e43881A6DAba3e2D8b861c3Db08CB18f24d` |

RPC: `https://rpc.testnet.chain.robinhood.com`

The demo strategies report configurable APYs (for example 12%, 8% and 15%), which lets you watch the agent react when rates change.

---

## Tech stack

- **Contracts:** Solidity 0.8.24, OpenZeppelin v5, Hardhat 3, viem, Hardhat Ignition
- **Backend:** Node.js, TypeScript, Express, viem, Qwen via Alibaba Cloud DashScope (OpenAI-compatible API)
- **Frontend:** React, Vite, wagmi and viem, Framer Motion

---

## Repository layout

```text
yield-pilot/
├── contracts/
│   ├── contracts/
│   │   ├── YieldVault.sol        # vault, shares, risk limits, timelock, pause
│   │   ├── IStrategy.sol         # interface every strategy adapter implements
│   │   ├── MockERC20.sol         # test token (anyone can mint)
│   │   └── mocks/MockStrategy.sol
│   ├── ignition/modules/DeployYieldStack.ts
│   ├── scripts/                  # setup-vault, smoke-test, add-strategy-c, set-apy
│   └── test/YieldVault.ts        # 13 tests
├── backend/
│   └── src/
│       ├── agent/                # scanner, qwen, autopilot, executor
│       └── api/server.ts         # REST API for the dashboard
└── frontend/                     # React dashboard
```

---

## Run it yourself

You need Node.js 20 or newer, a wallet with Robinhood testnet ETH for gas, and a DashScope API key for Qwen.

### 1. Contracts

```bash
cd contracts
npm install
npx hardhat build
npx hardhat test nodejs
```

Create `contracts/.env`:

```bash
RH_RPC_URL=https://rpc.testnet.chain.robinhood.com
PRIVATE_KEY=0xYOUR_TESTNET_PRIVATE_KEY
```

Deploy:

```bash
npx hardhat ignition deploy ignition/modules/DeployYieldStack.ts --network robinhoodTestnet
```

Then set the agent, deploy mock strategies, whitelist them and mint test tokens. Edit the addresses at the top of the script first:

```bash
npx hardhat run scripts/setup-vault.ts --network robinhoodTestnet
```

### 2. Backend

Create `backend/.env`:

```dotenv
RH_RPC_URL=https://rpc.testnet.chain.robinhood.com
PRIVATE_KEY=0xAGENT_WALLET_PRIVATE_KEY
VAULT_ADDRESS=0x...
USDC_ADDRESS=0x...
DASHSCOPE_API_KEY=your_key
QWEN_MODEL=qwen-plus
PORT=3001
AUTOPILOT_EXECUTE=false
AUTOPILOT_INTERVAL_SEC=60
```

```bash
cd backend
npm install
npx tsx src/index.ts
```

`AUTOPILOT_EXECUTE=false` is dry-run mode: the agent logs what it would do. Set it to `true` to let it send transactions.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed address, connect a wallet, switch to Robinhood testnet, and deposit mUSDC.

---

## Demo walkthrough

1. Connect a wallet on the dashboard and deposit mUSDC (approve first, then deposit).
2. Watch the **Agent** tab. The autopilot allocates idle funds into strategies, up to the 50% cap each.
3. Change a strategy's APY to simulate the market moving:

   ```bash
   cd contracts
   $env:STRAT="A"; $env:APY_BPS="1200"; npx hardhat run scripts/set-apy.ts --network robinhoodTestnet
   ```

   (PowerShell syntax shown. On macOS or Linux use `STRAT=A APY_BPS=1200 npx hardhat run ...`.)
4. Within a cycle the agent rebalances toward the higher yield, and the move appears in the log with its transaction hash.
5. Withdraw any time. The vault pulls funds back from strategies automatically if it needs liquidity.

---

## Tests

`contracts/test/YieldVault.ts` has 13 passing tests covering deposits and withdrawals, share accounting and yield, the cumulative 50% cap, the minimum APY gain, rejection of non-whitelisted strategies, withdrawal pulling funds back from strategies, the strategy timelock, pause behavior, emergency exit, and the zero-address checks.

```bash
cd contracts
npx hardhat test nodejs
```

---

## Known limitations

This is a hackathon prototype on a testnet. It has not been audited, and it should not hold real funds.

- **Strategies are mocks.** The demo strategies hold tokens and report an APY you can set, but they do not generate real yield. The strategy interface (`IStrategy`) is how real adapters for lending protocols would plug in. Those adapters are not built yet.
- **Cap drift on withdrawals.** The 50% cap is checked whenever the agent moves funds in. A user withdrawal takes liquidity from strategies in list order, which can leave one strategy temporarily above 50% until the next rebalance.
- **Demo wallet roles.** In the testnet demo, the same wallet is the vault owner and the agent. In production these should be separate keys, with the owner behind a multisig.
- **Dashboard gaps.** The Settings page is display-only for now (the real limits are the contract's), and the History page does not yet read on-chain events.
- **Earnings are not tracked.** Total earnings shows zero because the mock strategies do not accrue yield.

---

## Roadmap

- Real strategy adapters for lending protocols on Robinhood Chain and Arbitrum
- Withdrawals that respect the cap (lowest-APY-first or proportional), and risk-reducing rebalances out of an over-cap strategy
- Real on-chain transaction history and per-user earnings
- Wire the dashboard settings and Pause/Stop controls to the agent
- Separate owner, agent and guardian roles, plus an independent security review

---

## Author

**Umar Idris (Abbagigo)** · Blockchain engineer and Web3 builder
GitHub: [@Abbagigo13](https://github.com/Abbagigo13) · X: [@UmarIDR97364671](https://x.com/UmarIDR97364671) · Telegram: [@abbagigo](https://t.me/abbagigo) · [abbagigo.bond](https://abbagigo.bond)

## License

MIT, see [LICENSE](./LICENSE).
