import { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getStrategies, getHistory } from '../utils/api';

export function useYieldData(address) {
  const [portfolio, setPortfolio] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, h] = await Promise.all([
        getPortfolio(address),
        getStrategies(),
        getHistory(address),
      ]);
      setPortfolio(p);
      setStrategies(s);
      setHistory(h);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAll();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchAll]);

  return { portfolio, strategies, history, loading, refetch: fetchAll };
}