'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/hooks/use-theme';
import { THEME_META, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'midnight' ? 'Light' : 'Midnight';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted transition-all duration-200 hover:border-accent/25 hover:bg-raised hover:text-text',
        className
      )}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'midnight' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function ThemeQuickSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn('grid grid-cols-2 gap-1 rounded-xl border border-line bg-raised/70 p-1', className)}>
      {(['light', 'midnight'] as Theme[]).map((option) => {
        const active = theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all duration-200',
              active ? 'bg-card text-text shadow-soft' : 'text-muted hover:text-text'
            )}
          >
            {option === 'light' ? <Sun size={14} /> : <Moon size={14} />}
            {THEME_META[option].label}
          </button>
        );
      })}
    </div>
  );
}

function ThemePreview({ theme }: { theme: Theme }) {
  const light = theme === 'light';
  return (
    <div
      className="relative h-24 overflow-hidden rounded-xl border"
      style={{
        backgroundColor: light ? '#F7F6F2' : '#05070E',
        borderColor: light ? '#E2E5EA' : '#1E2940',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1/4 border-r"
        style={{
          backgroundColor: light ? '#FFFFFF' : '#090D18',
          borderColor: light ? '#E2E5EA' : '#1E2940',
        }}
      >
        <div className="mx-2 mt-3 h-1.5 w-8 rounded-full" style={{ backgroundColor: light ? '#10264A' : '#4C8DFF' }} />
        <div className="mx-2 mt-2 h-1 w-9 rounded-full" style={{ backgroundColor: light ? '#DDE3EC' : '#1E2940' }} />
        <div className="mx-2 mt-1.5 h-1 w-7 rounded-full" style={{ backgroundColor: light ? '#DDE3EC' : '#1E2940' }} />
        <div className="mx-2 mt-1.5 h-1 w-8 rounded-full" style={{ backgroundColor: light ? '#DDE3EC' : '#1E2940' }} />
      </div>
      <div className="absolute inset-y-0 left-1/4 right-0 p-3">
        <div className="flex gap-2">
          <div
            className="h-10 flex-1 rounded-lg border p-1.5"
            style={{ backgroundColor: light ? '#FFFFFF' : '#0C1120', borderColor: light ? '#E2E5EA' : '#1E2940' }}
          >
            <div className="h-1 w-6 rounded-full" style={{ backgroundColor: light ? '#10264A' : '#EFF3FC' }} />
            <div className="mt-1.5 h-1 w-10 rounded-full" style={{ backgroundColor: light ? '#DDE3EC' : '#1E2940' }} />
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: light ? '#EEF1F6' : '#111829' }}>
              <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: light ? '#3564AC' : '#4C8DFF' }} />
            </div>
          </div>
          <div
            className="h-10 w-14 rounded-lg border"
            style={{ backgroundColor: light ? '#FFFFFF' : '#0C1120', borderColor: light ? '#E2E5EA' : '#1E2940' }}
          />
        </div>
        <div
          className="mt-2 h-6 rounded-lg border"
          style={{ backgroundColor: light ? '#FFFFFF' : '#0C1120', borderColor: light ? '#E2E5EA' : '#1E2940' }}
        />
      </div>
    </div>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Color theme">
      {(['light', 'midnight'] as Theme[]).map((option) => {
        const active = theme === option;
        const meta = THEME_META[option];
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option)}
            className={cn(
              'group rounded-2xl border p-3 text-left transition-all duration-200',
              active
                ? 'border-accent/40 bg-accent-soft/40 shadow-soft'
                : 'border-line bg-surface hover:border-accent/20 hover:bg-raised'
            )}
          >
            <ThemePreview theme={option} />
            <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ backgroundColor: meta.dot }}
                >
                  {option === 'light' ? <Sun size={13} color="#FFFFFF" /> : <Moon size={13} color="#04101F" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{meta.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">{meta.description}</p>
                </div>
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  active
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-line bg-card text-transparent'
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
