'use client';

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'plain';

export function Card({
  className,
  children,
  variant = 'default',
}: {
  className?: string;
  children: ReactNode;
  variant?: CardVariant;
}) {
  const variants: Record<CardVariant, string> = {
    default: 'surface-card',
    elevated: 'surface-card shadow-float',
    interactive: 'surface-card hover-lift',
    plain: 'rounded-2xl border border-line bg-card',
  };
  return <div className={cn(variants[variant], className)}>{children}</div>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-contrast shadow-soft hover:bg-accent-strong hover:shadow-card active:translate-y-px',
  secondary:
    'border border-line/70 bg-raised text-text hover:border-accent/25 hover:bg-accent-soft hover:text-accent active:translate-y-px',
  ghost: 'bg-transparent text-text hover:bg-raised active:translate-y-px',
  outline:
    'border border-line bg-transparent text-text hover:border-accent/30 hover:bg-raised active:translate-y-px',
  danger:
    'border border-danger/25 bg-danger/10 text-danger hover:border-danger/40 hover:bg-danger/15 active:translate-y-px',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  const sizeStyles =
    size === 'sm'
      ? 'h-8 rounded-lg px-3 text-xs'
      : size === 'lg'
        ? 'h-12 rounded-xl px-6 text-sm'
        : 'h-10 rounded-xl px-4 text-sm';
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        sizeStyles,
        buttonStyles[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted transition-all duration-200 hover:border-accent/25 hover:bg-raised hover:text-text disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
      {!error && hint ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

const fieldClassName =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-text shadow-soft transition-colors placeholder:text-muted/70 hover:border-line focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClassName, 'resize-none', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClassName, 'cursor-pointer appearance-none', className)} {...props} />;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const frame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button'
      );
      focusable?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(frame);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgb(var(--overlay)/0.68)] p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          'animate-scaleIn flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-card shadow-float sm:max-w-lg sm:rounded-2xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-semibold tracking-tight text-text">
              {title}
            </h3>
            {description ? <p className="mt-1 text-sm leading-5 text-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="-m-1 shrink-0 rounded-xl p-1.5 text-muted transition-colors hover:bg-raised hover:text-text"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

type BadgeTone = 'low' | 'medium' | 'high' | 'neutral' | 'success' | 'danger' | 'accent';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    low: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-danger/10 text-danger border-danger/20',
    neutral: 'bg-raised text-muted border-line',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    accent: 'bg-accent-soft text-accent border-accent/15',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Progress({
  value,
  max,
  tone = 'accent',
  size = 'md',
  className,
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tones = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-raised',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-smooth', tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center',
        className
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm">
        <p className="text-base font-semibold tracking-tight text-text">{title}</p>
        {body && <p className="mt-1.5 text-sm leading-6 text-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent/90">{eyebrow}</p>
        ) : null}
        <h1 className="text-[28px] font-semibold tracking-[-0.045em] text-text sm:text-[34px]">{title}</h1>
        {description ? <div className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-accent-soft text-accent">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-text">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  progress,
  tone = 'accent',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  progress?: { value: number; max: number };
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClasses = {
    accent: 'bg-accent-soft text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  return (
    <Card className="group relative h-full overflow-hidden p-4 sm:p-5" variant="interactive">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-accent/[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-80"
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
        {icon ? (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border border-line/60 transition-transform duration-300 group-hover:scale-105',
              toneClasses[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p className="relative mt-3 text-[26px] font-semibold leading-none tracking-[-0.045em] text-text tabular-nums sm:text-[30px]">
        {value}
      </p>
      {progress ? <Progress value={progress.value} max={progress.max} tone={tone} className="mt-3" size="sm" /> : null}
      {sub ? <p className="relative mt-2 text-xs leading-5 text-muted">{sub}</p> : null}
    </Card>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('animate-slideUp', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-raised/60 p-1',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-200',
              active
                ? 'bg-card text-text shadow-soft ring-1 ring-line/70'
                : 'text-muted hover:bg-card/60 hover:text-text'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm leading-6 text-muted">
          This action cannot be undone. Your other data will remain untouched.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => void onConfirm()} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Avatar({ name, email, className }: { name?: string | null; email?: string | null; className?: string }) {
  const source = name?.trim() || email?.trim() || 'V';
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-contrast',
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}
