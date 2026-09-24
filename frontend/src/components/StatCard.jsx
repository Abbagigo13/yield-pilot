import { motion } from 'framer-motion';
import styles from './StatCard.module.css';

export default function StatCard({ label, value, sub, accent = 'green', delay = 0 }) {
  return (
    <motion.div
      className={`${styles.card} ${styles[accent]}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </motion.div>
  );
}