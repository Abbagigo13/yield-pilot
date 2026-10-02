import { useState, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((type, title, message, duration = 4000) => {
    setToast({
      id: ++toastId,
      type,
      title,
      message,
      duration,
    });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  const success = useCallback(
    (title, message) => show('success', title, message),
    [show]
  );
  const error = useCallback(
    (title, message) => show('error', title, message),
    [show]
  );
  const info = useCallback(
    (title, message) => show('info', title, message),
    [show]
  );
  const warning = useCallback(
    (title, message) => show('warning', title, message),
    [show]
  );

  return { toast, show, dismiss, success, error, info, warning };
}