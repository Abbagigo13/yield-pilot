import { motion } from 'framer-motion';
import styles from './RiskMeter.module.css';

const LEVELS = {
  low: { label: 'Low Risk', width: '33%', color: '#00ffa3' },
  medium: { label: 'Medium Risk', width: '66%', color: '#ffb800' },
  high: { label: 'High Risk', width: '100%', color: '#ff4d6d' },
};

export default function RiskMeter({ risk = 'low' }) {
  const level = LEVELS[risk] || LEVELS.low;
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <motion.div
          className={styles.fill}
          style={{ background: level.color }}
          initial={{ width: 0 }}
          animate={{ width: level.width }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className={styles.label} style={{ color: level.color }}>
        {level.label}
      </span>
    </div>
  );
}