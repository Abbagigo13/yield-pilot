import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import WalletConnect from '../components/WalletConnect';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import RiskMeter from '../components/RiskMeter';
import NetworkGraph3D from '../components/NetworkGraph3D';
import AgentChat from '../components/AgentChat';
import Loader from '../components/Loader';
import AnimatedButton from '../components/AnimatedButton';
import DepositPanel from '../components/DepositPanel';
import { useYieldData } from '../hooks/useYieldData';
import { useAgent } from '../hooks/useAgent';
import { useWallet } from '../hooks/useWallet';
import { formatUsd, formatPercent, timeAgo } from '../utils/format';
import styles from './Dashboard.module.css';
import MintButton from '../components/MintButton';

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const { address } = useWallet();
  const { portfolio, strategies, history, loading, refetch } = useYieldData(address);
  const { status, logs, start, stop } = useAgent();

  return (
    <div className={styles.layout}>
      <Sidebar active={tab} onChange={setTab} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>{tab}</h1>
            <p className={styles.pageSub}>
              {address
                ? `Connected: ${address.slice(0, 6)}…${address.slice(-4)}`
                : 'Wallet not connected'}
            </p>
          </div>
          <WalletConnect />
        </header>

        {loading ? (
          <Loader label="Loading portfolio…" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={styles.content}
            >
              {tab === 'overview' && (
                <OverviewTab
                  portfolio={portfolio}
                  status={status}
                  refetch={refetch}
                />
              )}
              {tab === 'strategies' && <StrategiesTab strategies={strategies} />}
              {tab === 'agent' && (
                <AgentTab status={status} logs={logs} onStart={start} onStop={stop} />
              )}
              {tab === 'history' && <HistoryTab history={history} />}
              {tab === 'settings' && (
  <SettingsTab status={status} onStart={start} onStop={stop} />
)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function OverviewTab({ portfolio, status, refetch }) {
  const p = portfolio ?? {
    totalDeposited: 0,
    totalEarnings: 0,
    currentApy: 0,
    activeStrategy: '—',
    change24h: 0,
    allocation: [],
  };

  return (
    <div className={styles.tabGrid}>
      <div className={styles.statsRow}>
        <StatCard
          label="Total Deposited"
          value={formatUsd(p.totalDeposited)}
          sub={`${formatPercent(p.change24h)} 24h`}
          accent="green"
        />
        <StatCard
          label="Total Earnings"
          value={formatUsd(p.totalEarnings)}
          sub="All-time"
          accent="blue"
        />
        <StatCard
          label="Current APY"
          value={formatPercent(p.currentApy)}
          sub={`Active: ${p.activeStrategy}`}
          accent="purple"
        />
        <StatCard
          label="Agent Status"
          value={status?.active ? 'Active' : 'Paused'}
          sub={status ? `Last rebalance ${timeAgo(status.lastRebalance)}` : '—'}
          accent="pink"
        />
      </div>

      <DepositPanel onSuccess={() => refetch?.()} />
              <MintButton />

      <div className={styles.twoCol}>
        <GlassCard className={styles.graphCard}>
          <div className={styles.cardHead}>
            <h3>Live Network</h3>
            <span className={styles.cardSub}>Yield opportunities across protocols</span>
          </div>
          <div className={styles.graphWrap}>
            <NetworkGraph3D nodeCount={18} showPulses interactive={false} />
          </div>
        </GlassCard>

        <GlassCard className={styles.allocCard}>
          <div className={styles.cardHead}>
            <h3>Allocation</h3>
            <span className={styles.cardSub}>Across active strategies</span>
          </div>
          <div className={styles.allocList}>
            {p.allocation.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No deposits yet. Fund the vault to see allocations.
              </p>
            ) : (
              p.allocation.map((a) => (
                <div key={a.name} className={styles.allocRow}>
                  <span className={styles.allocDot} style={{ background: a.color }} />
                  <span className={styles.allocName}>{a.name}</span>
                  <div className={styles.allocBar}>
                    <motion.div
                      className={styles.allocFill}
                      style={{ background: a.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.value}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                  <span className={styles.allocVal}>{a.value}%</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StrategiesTab({ strategies }) {
  return (
    <div className={styles.tabGrid}>
      <GlassCard>
        <div className={styles.cardHead}>
          <h3>Available Strategies</h3>
          <span className={styles.cardSub}>{strategies.length} opportunities</span>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Protocol</span>
            <span>Asset</span>
            <span>APY</span>
            <span>TVL</span>
            <span>Risk</span>
            <span>Allocation</span>
          </div>
          {strategies.map((s) => (
            <motion.div
              key={s.id}
              className={styles.tableRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className={styles.proto}>
                <span className={styles.protoDot} style={{ background: s.color }} />
                {s.name}
              </span>
              <span>{s.asset}</span>
              <span className={styles.apy}>{formatPercent(s.apy)}</span>
              <span>{formatUsd(s.tvl)}</span>
              <span>
                <RiskMeter risk={s.risk} />
              </span>
              <span>{s.allocation}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function AgentTab({ status, logs, onStart, onStop }) {
  return (
    <div className={styles.agentGrid}>
      <div className={styles.agentLeft}>
        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Agent Control</h3>
            <span className={styles.cardSub}>
              {status?.active ? 'Running' : 'Paused'}
            </span>
          </div>

          <div className={styles.agentStats}>
            <div className={styles.agentStat}>
              <span className={styles.agentStatVal}>{status?.decisionsCount ?? 0}</span>
              <span className={styles.agentStatLabel}>Decisions</span>
            </div>
            <div className={styles.agentStat}>
              <span className={styles.agentStatVal}>
                {status?.uptimeHours ?? 0}h
              </span>
              <span className={styles.agentStatLabel}>Uptime</span>
            </div>
            <div className={styles.agentStat}>
              <span className={styles.agentStatVal}>
                {status ? timeAgo(status.lastRebalance) : '—'}
              </span>
              <span className={styles.agentStatLabel}>Last Rebalance</span>
            </div>
          </div>

          <div className={styles.agentActions}>
            {status?.active ? (
              <AnimatedButton variant="danger" onClick={onStop}>
                Pause Agent
              </AnimatedButton>
            ) : (
              <AnimatedButton onClick={onStart}>Start Agent</AnimatedButton>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Decision Log</h3>
            <span className={styles.cardSub}>Real-time activity</span>
          </div>
          <div className={styles.logList}>
            {logs.map((l) => (
              <motion.div
                key={l.id}
                className={styles.logItem}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className={`${styles.logType} ${styles[l.type]}`}>
                  {l.type}
                </span>
                <span className={styles.logMsg}>{l.message}</span>
                <span className={styles.logTime}>{timeAgo(l.timestamp)}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className={styles.agentRight}>
        <AgentChat />
      </div>
    </div>
  );
}

function HistoryTab({ history }) {
  return (
    <div className={styles.tabGrid}>
      <GlassCard>
        <div className={styles.cardHead}>
          <h3>Transaction History</h3>
          <span className={styles.cardSub}>{history.length} events</span>
        </div>
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Type</span>
            <span>Amount</span>
            <span>Details</span>
            <span>Time</span>
            <span>Tx</span>
          </div>
          {history.map((h) => (
                        <div key={h.id} className={styles.tableRow}>
              <span
                data-label="Type"
                className={`${styles.typeBadge} ${
                  h.type === 'deposit' ? styles.deposit : styles.rebalance
                }`}
              >
                {h.type}
              </span>
              <span data-label="Amount">{formatUsd(h.amount)}</span>
              <span data-label="Details" className={styles.details}>
                {h.from && h.to ? `${h.from} → ${h.to}` : h.asset}
              </span>
              <span data-label="Time">{timeAgo(h.timestamp)}</span>
              <span data-label="Tx" className={styles.mono}>
                {h.txHash}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function SettingsTab({ status, onStart, onStop }) {
  const [risk, setRisk] = useState('balanced');
  const [maxPerStrategy, setMaxPerStrategy] = useState(50);
  const [minApyDelta, setMinApyDelta] = useState(0.3);
  const [notifications, setNotifications] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(true);

  return (
    <div className={styles.tabGrid}>
      <div className={styles.settingsGrid}>
        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Agent Risk Profile</h3>
            <span className={styles.cardSub}>
              Controls how aggressively the agent rebalances
            </span>
          </div>

          <div className={styles.riskSelector}>
            {['conservative', 'balanced', 'aggressive'].map((r) => (
              <button
                key={r}
                className={`${styles.riskBtn} ${
                  risk === r ? styles.riskBtnActive : ''
                }`}
                onClick={() => setRisk(r)}
              >
                <span className={styles.riskBtnLabel}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </span>
                <span className={styles.riskBtnDesc}>
                  {r === 'conservative' && 'Low-risk only'}
                  {r === 'balanced' && 'Mixed strategies'}
                  {r === 'aggressive' && 'Maximize APY'}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Limits & Thresholds</h3>
            <span className={styles.cardSub}>
              Guardrails the agent must respect
            </span>
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Max per Strategy</span>
              <span className={styles.sliderValue}>{maxPerStrategy}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={maxPerStrategy}
              onChange={(e) => setMaxPerStrategy(Number(e.target.value))}
              className={styles.slider}
            />
            <p className={styles.sliderHelp}>
              No single protocol can exceed this % of total deposits
            </p>
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderHeader}>
              <span>Min APY Delta to Rebalance</span>
              <span className={styles.sliderValue}>{minApyDelta}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={minApyDelta}
              onChange={(e) => setMinApyDelta(Number(e.target.value))}
              className={styles.slider}
            />
            <p className={styles.sliderHelp}>
              Agent only rebalances when yield difference exceeds this %
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Notifications</h3>
            <span className={styles.cardSub}>Stay informed</span>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <span className={styles.toggleLabel}>Rebalance alerts</span>
              <span className={styles.toggleDesc}>
                Notify when the agent moves funds
              </span>
            </div>
            <button
              className={`${styles.toggle} ${
                notifications ? styles.toggleOn : ''
              }`}
              onClick={() => setNotifications(!notifications)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <span className={styles.toggleLabel}>Auto-rebalance</span>
              <span className={styles.toggleDesc}>
                Let the agent act without manual approval
              </span>
            </div>
            <button
              className={`${styles.toggle} ${
                autoRebalance ? styles.toggleOn : ''
              }`}
              onClick={() => setAutoRebalance(!autoRebalance)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className={styles.cardHead}>
            <h3>Danger Zone</h3>
            <span className={styles.cardSub}>Emergency controls</span>
          </div>

          <div className={styles.dangerRow}>
            <div>
              <span className={styles.toggleLabel}>Emergency Stop</span>
              <span className={styles.toggleDesc}>
                Halt all agent activity immediately
              </span>
            </div>
            {status?.active ? (
              <AnimatedButton variant="danger" onClick={onStop}>
                Stop Agent
              </AnimatedButton>
            ) : (
              <AnimatedButton onClick={onStart}>Start Agent</AnimatedButton>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}