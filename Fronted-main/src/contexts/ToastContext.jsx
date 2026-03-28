import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './ToastHost.css';

const ToastContext = createContext(null);

/**
 * 轻量全局 Toast：替代 alert，提供短暂反馈（成功 / 提示 / 错误）
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showToast = useCallback((opts) => {
    const message = typeof opts === 'string' ? opts : opts?.message;
    if (!message) return;
    const variant = typeof opts === 'string' ? 'info' : (opts?.variant ?? 'info');
    const duration = typeof opts === 'string' ? 2600 : (opts?.duration ?? 2600);
    const vibrate = typeof opts === 'string' ? true : (opts?.vibrate !== false);

    clearTimer();
    setToast({ message, variant, key: Date.now() });

    if (vibrate && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(variant === 'error' ? 28 : 10);
    }

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    }
  }, []);

  useEffect(() => () => clearTimer(), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast
        && createPortal(
          <div
            key={toast.key}
            className={`nx-toast nx-toast--${toast.variant}`}
            role="status"
            aria-live="polite"
          >
            <span className="nx-toast__text">{toast.message}</span>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- 与 AppContext 一致
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
