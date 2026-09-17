import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../utils/formatters';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = 'info', duration = 3500 }: Omit<ToastData, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastData = { id, title, description, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
            info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white',
            warning: 'border-amber-200 bg-white',
            error: 'border-red-200 bg-white',
            info: 'border-blue-200 bg-white',
          };

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-2',
                borders[t.type || 'info']
              )}
            >
              {icons[t.type || 'info']}
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-semibold text-gray-900 leading-tight">{t.title}</h5>
                {t.description && <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
