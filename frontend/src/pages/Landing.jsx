import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import NetworkGraph3D from '../components/NetworkGraph3D';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import styles from './Landing.module.css';

const FEATURES = [
  {
    icon: '◈',
    title: 'Autonomous Rebalancing',
    desc: 'Agents monitor yields 24/7 and move capital into the best opportunities automatically.',
  },
  {
    icon: '◎',
    title: 'Risk-Managed Strategies',
    desc: 'Set exposure limits per protocol. The agent never exceeds your boundaries.',
  },
  {
    icon: '◇',
    title: 'Real-Time Analytics',
    desc: 'Track APY, earnings, and allocation across every strategy in one dashboard.',
  },
  {
    icon: '✦',
    title: 'AI-Driven Decisions',
    desc: 'Powered by Qwen. Natural-language commands and transparent decision logs.',
  },
];

const STEPS = [
  { n: '01', title: 'Connect Wallet', desc: 'Link your wallet to Robinhood Chain testnet.' },
  { n: '02', title: 'Deposit Assets', desc: 'Deposit USDC into the vault. You stay in control.' },
  { n: '03', title: 'Agent Optimizes', desc: 'The AI agent scans and rebalances across protocols.' },
  { n: '04', title: 'Withdraw Anytime', desc: 'No lockups. Your capital, your rules.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <NetworkGraph3D nodeCount={28} height="100%" showPulses interactive />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={styles.badge}
          >
            <span className={styles.badgeDot} />
            Built on Robinhood Chain · Arbitrum Orbit
          </motion.div>

          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            AI-Powered Yield
            <br />
            <span className="gradient-text">Optimization</span>
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Let autonomous agents maximize your DeFi yields while you sleep.
            Transparent, risk-managed, and always on.
          </motion.p>

          <motion.div
            className={styles.ctaRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <AnimatedButton size="lg" onClick={() => navigate('/app')}>
              Launch App →
            </AnimatedButton>
            <AnimatedButton
              size="lg"
              variant="ghost"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </AnimatedButton>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Why Yield Pilot</h2>
          <p className={styles.sectionSub}>
            Everything you need to optimize yields on-chain.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <GlassCard key={f.title} hover className={styles.feature} transition={{ delay: i * 0.08 }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSub}>Four steps to autonomous yields.</p>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              className={styles.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <span className={styles.stepNum}>{s.n}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className={styles.section}>
        <GlassCard glow className={styles.statsCard}>
          <div className={styles.statBlock}>
            <span className={styles.statValue}>4.8%</span>
            <span className={styles.statLabel}>Avg. APY</span>
          </div>
          <div className={styles.statBlock}>
            <span className={styles.statValue}>$2.4M</span>
            <span className={styles.statLabel}>Total Value Locked</span>
          </div>
          <div className={styles.statBlock}>
            <span className={styles.statValue}>12+</span>
            <span className={styles.statLabel}>Yield Sources</span>
          </div>
          <div className={styles.statBlock}>
            <span className={styles.statValue}>24/7</span>
            <span className={styles.statLabel}>Agent Uptime</span>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Yield Pilot · Built for Arbitrum Founder House</span>
        <div className={styles.footerLinks}>
          <a href="#">Docs</a>
          <a href="#">GitHub</a>
          <a href="#">Twitter</a>
        </div>
      </footer>
    </motion.div>
  );
}