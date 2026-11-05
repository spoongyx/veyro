'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, Check, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { InstallButton } from '@/components/pwa';
import { Avatar, Badge, Button, Card, Reveal, SectionHeading } from '@/components/ui';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useTheme } from '@/lib/hooks/use-theme';
import { getNotificationPermission, requestNotificationPermission, type NotificationPermission } from '@/lib/notifications';
import { isOnline } from '@/lib/offline';
import { cn } from '@/lib/utils/cn';

interface NotifSettings {
  reminders: boolean;
  pomodoroAlerts: boolean;
  dailySummary: boolean;
}

const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  reminders: true,
  pomodoroAlerts: true,
  dailySummary: false,
};

function loadNotifSettings(): NotifSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIF_SETTINGS;
  try {
    const raw = window.localStorage.getItem('veyro-notif-settings');
    if (raw) return { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_NOTIF_SETTINGS;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Toggle setting"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
        checked ? 'border-accent bg-accent' : 'border-line bg-raised',
        disabled ? 'cursor-not-allowed opacity-40' : ''
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 rounded-full shadow-soft transition-all duration-200',
          checked ? 'left-[22px] bg-accent-contrast' : 'left-0.5 bg-muted'
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, syncState } = useTheme();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotifSettings>(loadNotifSettings);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
    const update = () => setOnline(isOnline());
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const updateSetting = (key: keyof NotifSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      window.localStorage.setItem('veyro-notif-settings', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const syncCopy: Record<typeof syncState, string> = {
    local: 'Saved on this device',
    syncing: 'Syncing to your account...',
    synced: 'Synced to your account',
    error: 'Saved locally. Sync will retry when online.',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Reveal>
        <Card className="overflow-hidden p-0">
          <div className="relative overflow-hidden border-b border-line/70 bg-accent/[0.05] px-5 py-5 sm:px-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-accent/[0.12] blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <Avatar name={user?.email} email={user?.email} className="h-12 w-12 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{user?.email ?? 'Veyro member'}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Member since{' '}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                    : 'today'}
                </p>
              </div>
              <Badge tone="accent">
                <Check size={11} /> Active
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-xl border border-line/70 bg-surface/70 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">User ID</p>
              <p className="mt-1 truncate font-mono text-xs text-text">{user?.id ?? 'Not signed in'}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-surface/70 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Connection</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-text">
                {online ? <Wifi size={13} className="text-success" /> : <WifiOff size={13} className="text-warning" />}
                {online ? 'Online' : 'Offline - showing cached data'}
              </p>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={60}>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
            title="Appearance"
            description="Pick the atmosphere that helps you focus. Your choice follows your account."
          />
          <div className="mt-5">
            <ThemeSwitcher />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                syncState === 'synced' ? 'bg-success' : syncState === 'error' ? 'bg-danger' : 'bg-muted'
              )}
            />
            {syncCopy[syncState]}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={120}>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Bell size={17} />}
            title="Notifications"
            description="Quiet by default. Turn on only what deserves your attention."
          />
          <div className="mt-5 divide-y divide-line/60">
            <div className="flex items-center justify-between gap-5 py-4 first:pt-0">
              <div>
                <p className="text-sm font-medium text-text">Task reminders</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">A browser alert when a task reminder is due.</p>
              </div>
              <Toggle
                checked={settings.reminders}
                onChange={(v) => updateSetting('reminders', v)}
                disabled={permission !== 'granted'}
              />
            </div>
            <div className="flex items-center justify-between gap-5 py-4">
              <div>
                <p className="text-sm font-medium text-text">Pomodoro alerts</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">Know when a focus session or break ends.</p>
              </div>
              <Toggle
                checked={settings.pomodoroAlerts}
                onChange={(v) => updateSetting('pomodoroAlerts', v)}
                disabled={permission !== 'granted'}
              />
            </div>
            <div className="flex items-center justify-between gap-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-text">Daily summary</p>
                  <Badge tone="neutral">Soon</Badge>
                </div>
                <p className="mt-0.5 text-xs leading-5 text-muted">A gentle end-of-day recap of what moved forward.</p>
              </div>
              <Toggle checked={settings.dailySummary} onChange={(v) => updateSetting('dailySummary', v)} disabled />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-line/60 pt-4">
            <Button onClick={() => void handleEnableNotifications()} disabled={permission === 'granted'} size="sm">
              {permission === 'granted' ? (
                <>
                  <BellRing size={15} /> Notifications enabled
                </>
              ) : (
                'Enable notifications'
              )}
            </Button>
            <span className="text-xs capitalize text-muted">Permission: {permission}</span>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={180}>
        <Card className="p-5 sm:p-6">
          <SectionHeading
            icon={<Wifi size={17} />}
            title="Install & offline"
            description="Add Veyro to your home screen and keep working when the signal drops."
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <InstallButton />
            <span className="text-sm text-muted">
              {online ? 'Everything is up to date.' : 'Offline - changes will sync later.'}
            </span>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
