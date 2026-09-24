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
import { useYieldData } from '../hooks/useYieldData';
import { useAgent } from '../hooks/useAgent';
import { useWallet } from '../hooks/useWallet';
import { formatUsd, formatPercent, timeAgo } from '../utils/format';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const { address } = useWallet();
  const { portfolio, strategies, history, loading } = useYieldData(address);
  const { status, logs, start, stop } = useAgent();

  return (
    <div className={styles.layout}>
      <Sidebar active={tab} onChange={setTab} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>{tab}</h1>
            <p className={styles.pageSub}>
              {address ? `Connected: ${address.slice(0, 6)}…${address.slice(-4)}` : 'Wallet not connected'}
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
                <OverviewTab portfolio={portfolio} strategies={strategies} status={status} />
              )}
              {tab === 'strategies' && <StrategiesTab strategies={strategies} />}
              {tab === 'agent' && (
                <AgentTab status={status} logs={logs} onStart={start} onStop={stop} />
              )}
              {tab === 'history' && <HistoryTab history={history} />}
              {tab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function OverviewTab({ portfolio, status }) {
  return (
    <div className={styles.tabGrid}>
      <div className={styles.statsRow}>
        <StatCard
          label="Total Deposited"
          value={formatUsd(portfolio.totalDeposited)}
          sub={`${formatPercent(portfolio.change24h)} 24h`}
          accent="green"
        />
        <StatCard
          label="Total Earnings"
          value={formatUsd(portfolio.totalEarnings)}
          sub="All-time"
          accent="blue"
        />
        <StatCard
          label="Current APY"
          value={formatPercent(portfolio.currentApy)}
          sub={`Active: ${portfolio.activeStrategy}`}
          accent="purple"
        />
        <StatCard
          label="Agent Status"
          value={status?.active ? 'Active' : 'Paused'}
          sub={status ? `Last rebalance ${timeAgo(status.lastRebalance)}` : '—'}
          accent="pink"
        />
      </div>

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
            {portfolio.allocation.map((a) => (
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
            ))}
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
              <span>${(s.tvl / 1_000_000).toFixed(2)}M</span>
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
                className={`${styles.typeBadge} ${
                  h.type === 'deposit' ? styles.deposit : styles.rebalance
                }`}
              >
                {h.type}
              </span>
              <span>{formatUsd(h.amount)}</span>
              <span className={styles.details}>
                {h.from && h.to ? `${h.from} → ${h.to}` : h.asset}
              </span>
              <span>{timeAgo(h.timestamp)}</span>
              <span className={styles.mono}>{h.txHash}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className={styles.tabGrid}>
      <GlassCard>
        <div className={styles.cardHead}>
          <h3>Settings</h3>
          <span className={styles.cardSub}>Coming soon</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Wallet preferences, notification settings, and advanced risk controls will appear here.
        </p>
      </GlassCard>
    </div>
  );
}