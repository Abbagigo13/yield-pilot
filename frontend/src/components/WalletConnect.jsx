import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { robinhoodTestnet } from '../utils/wagmi';
import { formatAddress } from '../utils/format';
import AnimatedButton from './AnimatedButton';
import styles from './WalletConnect.module.css';

export default function WalletConnect({ size = 'md' }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);

  const isCorrectChain = chainId === robinhoodTestnet.id;

  // Auto-prompt chain switch if connected to wrong chain
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      switchChain?.({ chainId: robinhoodTestnet.id });
    }
  }, [isConnected, isCorrectChain, switchChain]);

  // ---- Connected state ----
  if (isConnected && address) {
    return (
      <div className={styles.connectedWrap}>
        {!isCorrectChain && (
          <button
            className={styles.switchBtn}
            onClick={() => switchChain?.({ chainId: robinhoodTestnet.id })}
          >
            Switch to Robinhood
          </button>
        )}
        <motion.button
          className={styles.connected}
          onClick={() => disconnect()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Click to disconnect"
        >
          <span className={styles.dot} />
          <span>{formatAddress(address)}</span>
        </motion.button>
      </div>
    );
  }

  // ---- Disconnected state ----
  return (
    <>
      <AnimatedButton size={size} onClick={() => setShowModal(true)}>
        Connect Wallet
      </AnimatedButton>

      <AnimatePresence>
        {showModal && (
          <WalletModal
            connectors={connectors}
            connect={connect}
            isPending={isPending}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Wallet Modal ---------------- */

function WalletModal({ connectors, connect, isPending, onClose }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>Connect a Wallet</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <p className={styles.modalSub}>
          Choose your preferred wallet to continue
        </p>

        <div className={styles.walletList}>
          {connectors.map((connector) => (
            <motion.button
              key={connector.uid}
              className={styles.walletItem}
              disabled={isPending}
              onClick={() => {
                connect({ connector });
                onClose();
              }}
              whileHover={{ x: 4, background: 'rgba(0,255,163,0.06)' }}
              whileTap={{ scale: 0.98 }}
            >
              <WalletIcon id={connector.id} />
              <div className={styles.walletInfo}>
                <span className={styles.walletName}>
                  {humanizeConnector(connector)}
                </span>
                <span className={styles.walletType}>
                  {connector.type === 'injected' ? 'Browser Extension' : connector.type}
                </span>
              </div>
              <span className={styles.walletArrow}>→</span>
            </motion.button>
          ))}
        </div>

        <div className={styles.modalFooter}>
          New to wallets?{' '}
          <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noreferrer">
            Learn more
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function humanizeConnector(connector) {
  const map = {
    metaMask: 'MetaMask',
    metaMaskSDK: 'MetaMask',
    coinbaseWallet: 'Coinbase Wallet',
    walletConnect: 'WalletConnect',
    injected: 'Browser Wallet',
  };
  return map[connector.id] || connector.name || 'Wallet';
}

function WalletIcon({ id }) {
  // Emoji-based placeholder icons — replace with SVG later
  const icons = {
    metaMask: '🦊',
    metaMaskSDK: '🦊',
    coinbaseWallet: '🔵',
    walletConnect: '🌐',
    injected: '👛',
  };
  return <span className={styles.walletIcon}>{icons[id] || '👛'}</span>;
}