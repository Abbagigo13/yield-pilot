import styles from './Loader.module.css';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}