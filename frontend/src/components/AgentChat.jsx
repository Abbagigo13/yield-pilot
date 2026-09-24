import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, mockChatHistory } from '../utils/api';
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
        { id: `msg-${Date.now()}-r`, ...reply },
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
              className={`${styles.msg} ${
                m.role === 'user' ? styles.user : styles.agent
              }`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {m.content}
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