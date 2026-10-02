import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import styles from './Navbar.module.css';

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
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
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <a
              className={styles.mobileLink}
              onClick={() => handleNav('features')}
            >
              Features
            </a>
            <a className={styles.mobileLink} onClick={() => handleNav('how')}>
              How it works
            </a>
            <a className={styles.mobileLink} onClick={() => handleNav('stats')}>
              Stats
            </a>
            <button
              className={styles.launch}
              onClick={() => {
                setMenuOpen(false);
                navigate('/app');
              }}
              style={{ width: '100%', marginTop: 8 }}
            >
              Launch App
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}