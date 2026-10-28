'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: AlertCircle, className: 'text-danger' },
  info: { icon: Info, className: 'text-accent' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, options?: { description?: string; tone?: ToastTone }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [
        ...prev.slice(-3),
        { id, title, description: options?.description, tone: options?.tone ?? 'success' },
      ]);
      const timer = setTimeout(() => dismiss(id), 4600);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
              aria-live="polite"
              aria-atomic="false"
            >
              {items.map((item) => {
                const { icon: Icon, className } = TONE_STYLES[item.tone];
                return (
                  <div
                    key={item.id}
                    className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-float animate-slideUp"
                  >
                    <Icon size={19} className={cn('mt-0.5 shrink-0', className)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text">{item.title}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-xs leading-5 text-muted">{item.description}</p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => dismiss(item.id)}
                      className="-m-1 rounded-lg p-1 text-muted transition-colors hover:bg-raised hover:text-text"
                      aria-label="Dismiss notification"
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
