import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Toast.module.css';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: 'var(--accent-green)',
  error: 'var(--danger)',
  info: 'var(--accent-blue)',
  warning: 'var(--warning)',
};

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onDismiss?.(), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={styles.stack}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={styles.toast}
            style={{ '--toast-accent': COLORS[toast.type] || COLORS.info }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            <div className={styles.icon}>{ICONS[toast.type] || ICONS.info}</div>
            <div className={styles.body}>
              <div className={styles.title}>{toast.title}</div>
              {toast.message && (
                <div className={styles.message}>{toast.message}</div>
              )}
            </div>
            <button className={styles.close} onClick={onDismiss}>
              ✕
            </button>
            <motion.div
              className={styles.progress}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}