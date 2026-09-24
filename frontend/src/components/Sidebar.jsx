import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◎' },
  { id: 'strategies', label: 'Strategies', icon: '◇' },
  { id: 'agent', label: 'Agent', icon: '◈' },
  { id: 'history', label: 'History', icon: '≡' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.brand}>
        <span className={styles.logoMark} />
        <span className={styles.brandName}>Yield Pilot</span>
      </Link>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <motion.button
            key={item.id}
            className={`${styles.item} ${
              active === item.id ? styles.active : ''
            }`}
            onClick={() => onChange(item.id)}
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
            {active === item.id && (
              <motion.span
                className={styles.indicator}
                layoutId="sidebar-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.networkPill}>
          <span className={styles.dot} />
          Robinhood Testnet
        </div>
      </div>
    </aside>
  );
}