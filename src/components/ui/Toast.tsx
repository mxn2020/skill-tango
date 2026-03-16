// ═══════════════════════════════════════════════════
// Skill-Tango — Toast System 
// Global toast context + hook 
// ═══════════════════════════════════════════════════

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Trophy, Info, X } from 'lucide-react';
import type { Toast } from '../../types';
import './Toast.css';

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  achievement: Trophy,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev.slice(-2), newToast]); // max 3 stacked
      const duration = toast.duration || (toast.type === 'achievement' ? 5000 : 3500);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                key={toast.id}
                className={`toast toast--${toast.type}`}
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                layout
              >
                <div className="toast__icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="toast__content">
                  <span className="toast__title">{toast.title}</span>
                  {toast.message && <span className="toast__message">{toast.message}</span>}
                </div>
                <button
                  className="toast__close"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
                <motion.div
                  className="toast__progress"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: (toast.duration || 3500) / 1000, ease: 'linear' }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
