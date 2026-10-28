'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  CalendarDays,
  Timer,
  Target,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Avatar } from '@/components/ui';
import { ThemeQuickSwitch, ThemeToggle } from '@/components/theme/ThemeSwitcher';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/habits', label: 'Habits', icon: Flame },
  { href: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/app/focus', label: 'Focus', icon: Timer },
  { href: '/app/goals', label: 'Goals', icon: Target },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

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

  return (
    <div className="min-h-screen bg-ink text-text">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/85 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/app/dashboard" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast shadow-soft transition-transform duration-200 group-hover:scale-105">
              V
            </span>
            <span className="text-lg font-bold tracking-tight text-text">Veyro</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-raised hover:text-text'
                )}
              >
                <item.icon
                  size={18}
                  className={cn('transition-transform duration-200', active ? 'scale-105' : 'group-hover:scale-105')}
                />
                <span>{item.label}</span>
                {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-line p-3">
          <div className="px-1">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70">
              Appearance
            </p>
            <ThemeQuickSwitch />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-2 py-2">
            <Avatar name={user?.email} email={user?.email} className="h-8 w-8 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text">{user?.email ?? 'Veyro member'}</p>
              <p className="truncate text-[10px] text-muted">Personal workspace</p>
            </div>
            <LogoutButton compact />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-ink/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/app/dashboard" className="flex items-center gap-2 text-base font-bold text-text">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-[10px] font-bold text-accent-contrast">
            V
          </span>
          Veyro
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="lg:min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-20 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-text lg:text-3xl">{title}</h1>
            </div>
          </div>
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-7 gap-0.5 px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[9px] font-medium transition-colors',
                  active ? 'text-accent' : 'text-muted'
                )}
              >
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
