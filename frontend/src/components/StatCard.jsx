import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './StatCard.module.css';

function parseTargetValue(target) {
  const match = String(target).match(/-?[\d,.]+/);
  if (!match) return null;

  const numeric = parseFloat(match[0].replace(/,/g, ''));
  return Number.isNaN(numeric) ? null : numeric;
}

function useCountUp(target, duration = 1200) {
  const numeric = parseTargetValue(target);
  const [value, setValue] = useState(() => numeric ?? 0);
  const startRef = useRef(null);

  useEffect(() => {
    if (numeric == null) return;

    startRef.current = null;
    let raf;
    const animate = (t) => {
      if (!startRef.current) startRef.current = t;
      const progress = Math.min((t - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(numeric * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setValue(numeric);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [numeric, duration]);

  return numeric == null ? target : value;
}

function formatLike(target, numericValue) {
  const str = String(target);
  if (str.includes('$')) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(numericValue);
  }
  if (str.includes('%')) {
    return `${numericValue.toFixed(2)}%`;
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    numericValue
  );
}

export default function StatCard({
  label,
  value,
  sub,
  accent = 'green',
  delay = 0,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const animated = useCountUp(value);

  return (
    <motion.div
      ref={ref}
      className={`${styles.card} ${styles[accent]}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {inView ? formatLike(value, animated) : value}
      </span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </motion.div>
  );
}