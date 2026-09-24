import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/format';
import AnimatedButton from './AnimatedButton';
import styles from './WalletConnect.module.css';

export default function WalletConnect({ size = 'md' }) {
  const { address, isConnected, connect, disconnect, isPending } = useWallet();

  if (isConnected && address) {
    return (
      <motion.button
        className={styles.connected}
        onClick={() => disconnect()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className={styles.dot} />
        <span>{formatAddress(address)}</span>
      </motion.button>
    );
  }

  return (
    <AnimatedButton size={size} onClick={connect} disabled={isPending}>
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </AnimatedButton>
  );
}