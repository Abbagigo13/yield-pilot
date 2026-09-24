import { useState, useEffect, useCallback } from 'react';
import { getAgentStatus, getAgentLogs, startAgent, stopAgent } from '../utils/api';

export function useAgent() {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([getAgentStatus(), getAgentLogs()]);
      setStatus(s);
      setLogs(l);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchAll, 0);
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

  return { status, logs, loading, start, stop, refetch: fetchAll };
}