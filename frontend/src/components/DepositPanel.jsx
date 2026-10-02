import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../hooks/useVault';
import { formatUsd } from '../utils/format';
import GlassCard from './GlassCard';
import AnimatedButton from './AnimatedButton';
import styles from './DepositPanel.module.css';
import { useToast } from '../context/ToastContext';

export default function DepositPanel({ onSuccess }) {
  const vault = useVault();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('deposit'); // 'deposit' | 'withdraw'
  const toast = useToast();
  const [step, setStep] = useState('idle');
  const lastTxHashRef = useRef(null);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

    const numericAmount = Number(amount) || 0;
  const needsApproval =
    mode === 'deposit' &&
    numericAmount > 0 &&
    vault.balances.allowance < numericAmount;
  const hasEnough =
    mode === 'deposit'
      ? numericAmount > 0 && numericAmount <= vault.balances.wallet
      : numericAmount > 0 && numericAmount <= vault.balances.vault;
  const canApprove = needsApproval && hasEnough && !vault.isPending && !vault.isConfirming;
  const canDeposit = !needsApproval && hasEnough && numericAmount > 0 && !vault.isPending && !vault.isConfirming;
  const canWithdraw =
    mode === 'withdraw' &&
    hasEnough &&
    numericAmount > 0 &&
    !vault.isPending &&
    !vault.isConfirming;

  // Watch tx completion
  useEffect(() => {
    if (!vault.isConfirmed || !vault.txHash || vault.txHash === lastTxHashRef.current) {
      return;
    }

    lastTxHashRef.current = vault.txHash;
    const tx = vault.txHash;

    const timeoutId = setTimeout(() => {
      if (stepRef.current === 'approving') {
        setStep('approved');
        vault.refetchAll();
        toast.success('Approval confirmed', 'You can now deposit');
      } else if (stepRef.current === 'depositing') {
        setStep('done');
        setAmount('');
        vault.refetchAll();
        onSuccess?.();
        toast.success('Deposit confirmed', `Tx: ${tx.slice(0, 10)}…`);
        const t = setTimeout(() => setStep('idle'), 3000);
        return () => clearTimeout(t);
      } else if (stepRef.current === 'withdrawing') {
        setStep('done');
        setAmount('');
        vault.refetchAll();
        onSuccess?.();
        toast.success('Withdrawal confirmed', `Tx: ${tx.slice(0, 10)}…`);
        const t = setTimeout(() => setStep('idle'), 3000);
        return () => clearTimeout(t);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [vault, onSuccess, toast]);

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

  const handleWithdraw = () => {
    if (!canWithdraw) return;
    setStep('withdrawing');
    vault.withdraw(numericAmount);
  };

  const handleMax = () => {
    setAmount(
      mode === 'deposit'
        ? vault.balances.wallet.toString()
        : vault.balances.vault.toString()
    );
  };

  const handleReset = () => {
    vault.resetWrite();
    setStep('idle');
    lastTxHashRef.current = null;
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

      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === 'deposit' ? styles.modeTabActive : ''}`}
          onClick={() => { setMode('deposit'); setAmount(''); setStep('idle'); }}
        >
          Deposit
        </button>
        <button
          className={`${styles.modeTab} ${mode === 'withdraw' ? styles.modeTabActive : ''}`}
          onClick={() => { setMode('withdraw'); setAmount(''); setStep('idle'); }}
        >
          Withdraw
        </button>
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
          {mode === 'withdraw'
            ? 'Amount exceeds your vault balance.'
            : 'Amount exceeds your wallet balance.'}
        </div>
      )}

      <div className={styles.actions}>
        {mode === 'withdraw' ? (
          <AnimatedButton
            onClick={handleWithdraw}
            disabled={!canWithdraw}
            className={styles.fullWidth}
          >
            {step === 'withdrawing'
              ? 'Withdrawing…'
              : vault.isConfirming
              ? 'Confirming…'
              : numericAmount > 0
              ? `Withdraw ${numericAmount} USDC`
              : 'Enter amount'}
          </AnimatedButton>
        ) : needsApproval ? (
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
            ✓ {mode === 'deposit' ? 'Deposit' : 'Withdrawal'} confirmed
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