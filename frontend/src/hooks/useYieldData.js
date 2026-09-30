import { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getStrategies, getHistory } from '../utils/api';

const FALLBACK_PORTFOLIO = {
  totalDeposited: 0,
  totalEarnings: 0,
  currentApy: 0,
  activeStrategy: '—',
  change24h: 0,
  allocation: [],
};

export function useYieldData(address) {
  const [portfolio, setPortfolio] = useState(FALLBACK_PORTFOLIO);
  const [strategies, setStrategies] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, h] = await Promise.all([
        getPortfolio(address).catch(() => FALLBACK_PORTFOLIO),
        getStrategies().catch(() => []),
        getHistory(address).catch(() => []),
      ]);
      setPortfolio(p ?? FALLBACK_PORTFOLIO);
      setStrategies(s ?? []);
      setHistory(h ?? []);
    } catch (e) {
      console.error('[useYieldData]', e);
      setError(e);
      setPortfolio(FALLBACK_PORTFOLIO);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [p, s, h] = await Promise.all([
          getPortfolio(address).catch(() => FALLBACK_PORTFOLIO),
          getStrategies().catch(() => []),
          getHistory(address).catch(() => []),
        ]);

        if (cancelled) return;

        setPortfolio(p ?? FALLBACK_PORTFOLIO);
        setStrategies(s ?? []);
        setHistory(h ?? []);
      } catch (e) {
        if (cancelled) return;

        console.error('[useYieldData]', e);
        setError(e);
        setPortfolio(FALLBACK_PORTFOLIO);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [address]);

  return { portfolio, strategies, history, loading, error, refetch: fetchAll };
}