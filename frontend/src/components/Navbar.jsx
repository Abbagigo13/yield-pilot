import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import styles from './Navbar.module.css';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <motion.nav
      className={styles.nav}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/" className={styles.brand}>
        <span className={styles.logoMark} />
        <span className={styles.brandName}>Yield Pilot</span>
      </Link>

      <div className={styles.links}>
        <a href="#features" className={styles.link}>
          Features
        </a>
        <a href="#how" className={styles.link}>
          How it works
        </a>
        <a href="#stats" className={styles.link}>
          Stats
        </a>
      </div>

      <div className={styles.actions}>
        <button className={styles.launch} onClick={() => navigate('/app')}>
          Launch App
        </button>
        <WalletConnect />
      </div>
    </motion.nav>
  );
}