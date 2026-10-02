/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = (type, title, message, duration = 4000) => {
    setToast({ id: Date.now(), type, title, message, duration });
  };

  const api = {
    show,
    dismiss: () => setToast(null),
    success: (title, message) => show('success', title, message),
    error: (title, message) => show('error', title, message),
    info: (title, message) => show('info', title, message),
    warning: (title, message) => show('warning', title, message),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}