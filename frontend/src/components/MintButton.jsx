import { useEffect } from 'react';
import { useVault } from '../hooks/useVault';

export default function MintButton() {
  const {
    isConnected,
    mint,
    refetchAll,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
  } = useVault();

  useEffect(() => {
    if (isConfirmed) refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  if (!isConnected) return null;

  const busy = isPending || isConfirming;
  const label = isPending
    ? 'Confirm in your wallet...'
    : isConfirming
    ? 'Minting...'
    : 'Get 1,000 test mUSDC';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={busy}
        onClick={() => mint(1000)}
        style={{
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent',
          color: 'inherit',
          cursor: busy ? 'default' : 'pointer',
          fontSize: 13,
        }}
      >
        {label}
      </button>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Free test token for trying the vault on Robinhood testnet
      </span>
      {writeError && (
        <span style={{ color: '#ff6b81', fontSize: 12 }}>
          {writeError.shortMessage || 'Mint failed'}
        </span>
      )}
    </div>
  );
}