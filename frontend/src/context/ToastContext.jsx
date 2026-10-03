import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((type, title, message, duration = 4000) => {
    setToast({ id: Date.now(), type, title, message, duration });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (title, message) => show('success', title, message),
      error: (title, message) => show('error', title, message),
      info: (title, message) => show('info', title, message),
      warning: (title, message) => show('warning', title, message),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}