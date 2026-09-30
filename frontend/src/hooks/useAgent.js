import { useState, useEffect, useCallback } from 'react';
import { getAgentStatus, getAgentLogs, startAgent, stopAgent } from '../utils/api';

const FALLBACK_STATUS = {
  active: false,
  lastRebalance: null,
  decisionsCount: 0,
  uptimeHours: 0,
  riskTolerance: 'balanced',
  maxPerStrategy: 50,
  agentAddress: null,
  agentBalances: { eth: 0, usdc: 0 },
};

export function useAgent() {
  const [status, setStatus] = useState(FALLBACK_STATUS);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([
        getAgentStatus().catch(() => FALLBACK_STATUS),
        getAgentLogs().catch(() => []),
      ]);
      setStatus(s ?? FALLBACK_STATUS);
      setLogs(l ?? []);
    } catch (e) {
      console.error('[useAgent]', e);
      setError(e);
      setStatus(FALLBACK_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAll]);

  const start = useCallback(async () => {
    await startAgent();
    await fetchAll();
  }, [fetchAll]);

  const stop = useCallback(async () => {
    await stopAgent();
    await fetchAll();
  }, [fetchAll]);

  return { status, logs, loading, error, start, stop, refetch: fetchAll };
}