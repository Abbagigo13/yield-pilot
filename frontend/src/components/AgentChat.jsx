import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, mockChatHistory } from '../utils/api';
import { formatPercent, formatUsd } from '../utils/format';
import GlassCard from './GlassCard';
import styles from './AgentChat.module.css';

export default function AgentChat() {
  const [messages, setMessages] = useState(mockChatHistory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage(text);
      setMessages((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-r`,
          role: 'agent',
          content: reply.content,
          toolCalls: reply.toolCalls,
          toolResult: reply.toolResult,
          timestamp: reply.timestamp || Date.now(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-err`,
          role: 'agent',
          content: 'Sorry, something went wrong. Try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <GlassCard className={styles.card}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <span>Agent Chat</span>
      </div>

      <div className={styles.messages} ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={m.role === 'user' ? styles.userWrap : styles.agentWrap}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`${styles.msg} ${
                  m.role === 'user' ? styles.user : styles.agent
                }`}
              >
                {m.content}
              </div>

              {/* Render tool result card if present */}
              {m.toolResult && (
                <ToolResultCard call={m.toolCalls?.[0]} result={m.toolResult} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className={`${styles.msg} ${styles.agent} ${styles.typing}`}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Ask the agent…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          className={styles.send}
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          ↑
        </button>
      </div>
    </GlassCard>
  );
}

/* ---------------- Tool Result Card ---------------- */

function ToolResultCard({ call, result }) {
  if (!result) return null;

  // execute_rebalance
  if (result.status === 'pending_confirmation') {
    const intent = result.intent || {};
    return (
      <div className={styles.toolCard}>
        <div className={styles.toolHeader}>
          <span className={styles.toolIcon}>↻</span>
          <span>Rebalance Intent</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>From</span>
          <span className={styles.toolValue}>{intent.fromProtocol}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>To</span>
          <span className={styles.toolValue}>{intent.toProtocol}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Amount</span>
          <span className={styles.toolValue}>{intent.amount} USDC</span>
        </div>
        <div className={styles.toolFooter}>Awaiting confirmation</div>
      </div>
    );
  }

  // get_best_yield (single strategy)
  if (result.name && result.apy !== undefined) {
    return (
      <div className={styles.toolCard}>
        <div className={styles.toolHeader}>
          <span className={styles.toolIcon}>★</span>
          <span>Best Yield Found</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Protocol</span>
          <span className={styles.toolValue}>{result.name}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Asset</span>
          <span className={styles.toolValue}>{result.asset}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>APY</span>
          <span className={styles.toolValueHighlight}>
            {formatPercent(result.apy)}
          </span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Risk</span>
          <span className={styles.toolValue}>{result.risk}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>TVL</span>
          <span className={styles.toolValue}>{formatUsd(result.tvl)}</span>
        </div>
      </div>
    );
  }

  // get_portfolio_status
  if (result.totalDeposits !== undefined) {
    return (
      <div className={styles.toolCard}>
        <div className={styles.toolHeader}>
          <span className={styles.toolIcon}>◎</span>
          <span>Portfolio</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Deposited</span>
          <span className={styles.toolValue}>{formatUsd(result.totalDeposits)}</span>
        </div>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Wallet Balance</span>
          <span className={styles.toolValue}>
            {formatUsd(result.userWalletBalance)}
          </span>
        </div>
      </div>
    );
  }

  // Fallback: JSON
  return (
    <div className={styles.toolCard}>
      <div className={styles.toolHeader}>
        <span className={styles.toolIcon}>⚙</span>
        <span>{call?.name || 'Tool Result'}</span>
      </div>
      <pre className={styles.toolPre}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}