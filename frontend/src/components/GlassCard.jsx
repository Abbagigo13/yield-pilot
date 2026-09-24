import { motion } from 'framer-motion';
import styles from './GlassCard.module.css';

export default function GlassCard({
  children,
  className = '',
  glow = false,
  hover = false,
  ...rest
}) {
  return (
    <motion.div
      className={`${styles.card} ${glow ? styles.glow : ''} ${
        hover ? styles.hover : ''
      } ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}