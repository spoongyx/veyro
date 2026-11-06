'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Flame,
  CalendarDays,
  Timer,
  Target,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Avatar } from '@/components/ui';
import { ThemeQuickSwitch, ThemeToggle } from '@/components/theme/ThemeSwitcher';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/ai', label: 'AI', icon: Sparkles },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/habits', label: 'Habits', icon: Flame },
  { href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/app/focus', label: 'Focus', icon: Timer },
  { href: '/app/goals', label: 'Goals', icon: Target },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== '/app/settings');

const COLLAPSE_KEY = 'veyro-nav-collapsed';

function getPageTitle(pathname: string): string {
  if (pathname === '/app/dashboard') return 'Dashboard';
  const match = pathname.match(/^\/app\/(.+)$/);
  if (match) {
    const seg = match[1];
    const found = NAV_ITEMS.find((n) => n.href === `/app/${seg}`);
    if (found) return found.label;
  }
  return 'Veyro';
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (compact) {
    return (
      <button
        onClick={() => void handleLogout()}
        disabled={loading}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-danger disabled:opacity-50"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={15} />
      </button>
    );
  }

  return (
    <button
      onClick={() => void handleLogout()}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-text disabled:opacity-50"
    >
      <LogOut size={18} />
      <span>Log out</span>
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = getPageTitle(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Storage can be unavailable in private contexts.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen min-h-dvh bg-ink text-text">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line/80 bg-surface/70 backdrop-blur-xl transition-[width] duration-300 ease-smooth lg:flex',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-line/60', collapsed ? 'justify-center px-3' : 'justify-between px-5')}>
          <Link
            href="/app/dashboard"
            aria-label="Veyro dashboard"
            className={cn('group flex items-center gap-2.5', collapsed && 'justify-center')}
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast shadow-[0_0_24px_-6px_rgb(var(--accent)/0.8)] transition-transform duration-200 group-hover:scale-105"
            >
              V
            </span>
            {!collapsed ? <span className="text-lg font-semibold tracking-tight text-text">Veyro</span> : null}
          </Link>
          {!collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
              aria-label="Collapse sidebar"
              aria-expanded={!collapsed}
            >
              <PanelLeftClose size={16} />
            </button>
          ) : null}
        </div>

        <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
              Workspace
            </p>
          ) : (
            <div className="mx-auto mb-3 h-px w-8 bg-line" />
          )}
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                    collapsed ? 'h-11 justify-center' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:bg-raised/70 hover:text-text'
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
                    />
                  ) : null}
                  <item.icon
                    size={18}
                    className={cn('shrink-0 transition-transform duration-200', active ? 'scale-105' : 'group-hover:scale-105')}
                  />
                  {!collapsed ? (
                    <>
                      <span>{item.label}</span>
                      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                    </>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {collapsed ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={toggleCollapsed}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-raised hover:text-text"
                aria-label="Expand sidebar"
                aria-expanded={!collapsed}
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          ) : null}
        </nav>

        <div className={cn('border-t border-line/60 p-3', collapsed && 'flex flex-col items-center gap-2')}>
          {!collapsed ? (
            <>
              <div className="mb-3 px-1">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
                  Appearance
                </p>
                <ThemeQuickSwitch />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-card/70 px-2 py-2">
                <Avatar name={user?.email} email={user?.email} className="h-8 w-8 rounded-lg text-[10px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text">{user?.email ?? 'Veyro member'}</p>
                  <p className="truncate text-[10px] text-muted">Personal workspace</p>
                </div>
                <LogoutButton compact />
              </div>
            </>
          ) : (
            <>
              <ThemeToggle className="h-9 w-9" />
              <Avatar name={user?.email} email={user?.email} className="h-8 w-8 rounded-lg text-[10px]" />
              <LogoutButton compact />
            </>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-line/70 bg-ink/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <Link href="/app/dashboard" aria-label="Veyro dashboard" className="flex items-center gap-2 text-base font-semibold text-text">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-[10px] font-bold text-accent-contrast"
          >
            V
          </span>
          Veyro
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/app/settings" aria-label="Open settings">
            <Avatar name={user?.email} email={user?.email} className="h-8 w-8 rounded-lg text-[10px]" />
          </Link>
        </div>
      </header>

      <main className={cn('transition-[padding] duration-300 ease-smooth lg:min-h-screen', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <div className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-line/60 bg-ink/85 px-8 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">{todayLabel}</span>
            <span className="text-line">/</span>
            <span className="text-sm font-semibold tracking-tight text-text">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/app/settings"
              className="flex items-center gap-2 rounded-xl border border-line/70 bg-card/60 py-1 pl-1 pr-3 transition-colors hover:border-accent/30 hover:bg-raised"
            >
              <Avatar name={user?.email} email={user?.email} className="h-7 w-7 rounded-lg text-[10px]" />
              <span className="max-w-[160px] truncate text-xs font-medium text-muted">{user?.email}</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">
          <div className="mb-6 lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{todayLabel}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-text">{title}</h1>
          </div>
          <div key={pathname} className="animate-fadeIn">
            {children}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-7 gap-0.5 px-1 py-1.5">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[9px] font-medium transition-colors',
                  active ? 'text-accent' : 'text-muted'
                )}
              >
                {active ? (
                  <span aria-hidden="true" className="absolute -top-1.5 h-[2px] w-6 rounded-full bg-accent" />
                ) : null}
                <item.icon size={19} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
