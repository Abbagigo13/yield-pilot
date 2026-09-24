export function formatUsd(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(value, digits = 2) {
  const n = Number(value) || 0;
  return `${n.toFixed(digits)}%`;
}

export function formatAddress(addr, chars = 4) {
  if (!addr) return '';
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function formatNumber(value, digits = 2) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function timeAgo(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}