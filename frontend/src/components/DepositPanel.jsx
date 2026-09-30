import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../hooks/useVault';
import { formatUsd } from '../utils/format';
import GlassCard from './GlassCard';
import AnimatedButton from './AnimatedButton';
import styles from './DepositPanel.module.css';

export default function DepositPanel({ onSuccess }) {
  const vault = useVault();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('idle'); // idle | approving | approved | depositing | done
  const [lastTxHash, setLastTxHash] = useState(null);

  const numericAmount = Number(amount) || 0;
  const needsApproval = numericAmount > 0 && vault.balances.allowance < numericAmount;
  const hasEnough = numericAmount > 0 && numericAmount <= vault.balances.wallet;
  const canApprove = needsApproval && hasEnough && !vault.isPending && !vault.isConfirming;
  const canDeposit = !needsApproval && hasEnough && numericAmount > 0 && !vault.isPending && !vault.isConfirming;

  // Watch tx completion
  useEffect(() => {
    if (vault.isConfirmed && vault.txHash && vault.txHash !== lastTxHash) {
      setLastTxHash(vault.txHash);
      if (step === 'approving') {
        setStep('approved');
        vault.refetchAll();
      } else if (step === 'depositing') {
        setStep('done');
        setAmount('');
        vault.refetchAll();
        onSuccess?.();
        setTimeout(() => setStep('idle'), 3000);
      }
    }
  }, [vault.isConfirmed, vault.txHash, lastTxHash, step, vault, onSuccess]);

  const handleApprove = () => {
    if (!canApprove) return;
    setStep('approving');
    vault.approve(numericAmount);
  };

  const handleDeposit = () => {
    if (!canDeposit) return;
    setStep('depositing');
    vault.deposit(numericAmount);
  };

  const handleMax = () => {
    setAmount(vault.balances.wallet.toString());
  };

  const handleReset = () => {
    vault.resetWrite();
    setStep('idle');
    setLastTxHash(null);
  };

  return (
    <GlassCard className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Deposit USDC</h3>
          <p className={styles.subtitle}>
            Fund the vault so the agent can optimize your yield
          </p>
        </div>
        <div className={styles.balances}>
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>Wallet</span>
            <span className={styles.balanceValue}>
              {formatUsd(vault.balances.wallet)}
            </span>
          </div>
          <div className={styles.balanceRow}>
            <span className={styles.balanceLabel}>In Vault</span>
            <span className={styles.balanceValueHighlight}>
              {formatUsd(vault.balances.vault)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.inputRow}>
        <div className={styles.inputWrap}>
          <input
            type="number"
            className={styles.input}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={vault.isPending || vault.isConfirming}
            min="0"
            step="any"
          />
          <button className={styles.maxBtn} onClick={handleMax}>
            MAX
          </button>
        </div>
        <span className={styles.asset}>mUSDC</span>
      </div>

      {!vault.isConnected && (
        <div className={styles.warning}>Connect your wallet to deposit.</div>
      )}

      {vault.isConnected && numericAmount > 0 && !hasEnough && (
        <div className={styles.warning}>
          Amount exceeds your wallet balance.
        </div>
      )}

      <div className={styles.actions}>
        {needsApproval ? (
          <AnimatedButton
            onClick={handleApprove}
            disabled={!canApprove}
            className={styles.fullWidth}
          >
            {step === 'approving'
              ? 'Approving…'
              : vault.isConfirming
              ? 'Confirming…'
              : 'Step 1: Approve USDC'}
          </AnimatedButton>
        ) : (
          <AnimatedButton
            onClick={handleDeposit}
            disabled={!canDeposit}
            className={styles.fullWidth}
          >
            {step === 'depositing'
              ? 'Depositing…'
              : vault.isConfirming
              ? 'Confirming…'
              : numericAmount > 0
              ? `Deposit ${numericAmount} USDC`
              : 'Enter amount'}
          </AnimatedButton>
        )}
      </div>

      <AnimatePresence>
        {vault.writeError && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className={styles.errorMsg}>
              {vault.writeError.shortMessage || vault.writeError.message}
            </span>
            <button className={styles.retry} onClick={handleReset}>
              Reset
            </button>
          </motion.div>
        )}
        {step === 'done' && (
          <motion.div
            className={styles.success}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✓ Deposit confirmed
            {vault.txHash && (
              <a
                className={styles.txLink}
                href={`https://explorer.testnet.chain.robinhood.com/tx/${vault.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View tx ↗
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}