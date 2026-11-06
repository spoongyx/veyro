'use client';

import { useEffect, useRef, useState } from 'react';
import { AtSign, Bell, BellRing, Camera, Check, Moon, Sun, UserRound, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUsernameAvailability } from '@/lib/hooks/use-username-availability';
import { InstallButton } from '@/components/pwa';
import { UsernameStatusLine } from '@/components/profile/UsernameStatusLine';
import { Avatar, Badge, Button, Card, Input, Reveal, SectionHeading } from '@/components/ui';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useTheme } from '@/lib/hooks/use-theme';
import {
  getNotificationPermission,
  loadNotificationSettings,
  requestNotificationPermission,
  saveNotificationSettings,
  type NotificationPermission,
} from '@/lib/notifications';
import {
  USERNAME_MAX_LENGTH,
  normalizeUsername,
  uploadAvatar,
  validateAvatarFile,
  validateUsername,
} from '@/lib/profile';
import { createClient } from '@/lib/supabase/client';
import type { AppNotificationSettings } from '@/lib/types';
import { isOnline } from '@/lib/offline';
import { cn } from '@/lib/utils/cn';

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

function ProfileCard() {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availability = useUsernameAvailability(username, user?.id, profile?.username);
  const usernameProblem = validateUsername(username);
  const changed = normalizeUsername(username) !== (profile?.username ?? '') || avatarFile !== null;

  useEffect(() => {
    setUsername(profile?.username ?? '');
  }, [profile?.username]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaved(false);
    setAvatarFile(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const clean = normalizeUsername(username);
    const problem = validateUsername(clean);
    if (problem) {
      setError(problem);
      return;
    }
    if (availability === 'taken') {
      setError('That username is already taken. Try another one.');
      return;
    }
    if (availability === 'checking') {
      setError('Hang on while we check that username.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createClient();
      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
        const upload = await uploadAvatar(supabase, user.id, avatarFile);
        if (upload.error || !upload.url) {
          setError(upload.error ?? 'Could not upload your picture. Try again.');
          return;
        }
        avatarUrl = upload.url;
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: clean, avatar_url: avatarUrl }, { onConflict: 'id' });

      if (saveError) {
        setError(
          saveError.code === '23505'
            ? 'That username is already taken. Try another one.'
            : saveError.message
        );
        return;
      }

      setAvatarFile(null);
      await refreshProfile();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <SectionHeading
        icon={<UserRound size={17} />}
        title="Profile"
        description="Your username and picture appear across Veyro."
      />
      <form onSubmit={handleSave} className="mt-5 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            name={profile?.username ?? user?.email}
            email={user?.email}
            src={avatarPreview ?? profile?.avatar_url}
            className="h-16 w-16 text-lg"
          />
          <div className="min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={15} /> Change picture
            </Button>
            <p className="mt-1.5 text-[11px] text-muted">
              Square images look best. JPG, PNG, or WebP up to 5 MB.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="settings-username" className="mb-1.5 block text-sm font-medium text-text">
            Username
          </label>
          <div className="relative">
            <AtSign
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              id="settings-username"
              autoComplete="username"
              spellCheck={false}
              maxLength={USERNAME_MAX_LENGTH}
              className="pl-9"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setSaved(false);
                setError(null);
              }}
            />
          </div>
          <UsernameStatusLine status={availability} />
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}
        {saved ? (
          <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Profile updated.
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={saving}
            disabled={
              saving ||
              !changed ||
              Boolean(usernameProblem) ||
              availability === 'checking' ||
              availability === 'taken'
            }
          >
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { theme, syncState } = useTheme();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<AppNotificationSettings>(loadNotificationSettings);
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

  const updateSetting = (key: keyof AppNotificationSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  };

  const toggleReminderSetting = async (key: 'reminders' | 'pomodoroAlerts', value: boolean) => {
    if (value && permission === 'default') {
      const result = await handleEnableNotifications();
      if (result !== 'granted') return;
    }
    updateSetting(key, value);
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
              <Avatar
                name={profile?.username ?? user?.email}
                email={user?.email}
                src={profile?.avatar_url}
                className="h-12 w-12 text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {profile?.username ?? user?.email ?? 'Veyro member'}
                </p>
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
            <div className="rounded-xl border border-line/70 bg-surface/70 px-4 py-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Email</p>
              <p className="mt-1 truncate text-xs text-text">{user?.email ?? 'Not signed in'}</p>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={30}>
        <ProfileCard />
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
                <p className="mt-0.5 text-xs leading-5 text-muted">A browser alert when a task reminder is due (Veyro must be open). Turn off to silence all task reminders.</p>
              </div>
              <Toggle
                checked={settings.reminders}
                onChange={(v) => void toggleReminderSetting('reminders', v)}
                disabled={permission === 'unsupported'}
              />
            </div>
            <div className="flex items-center justify-between gap-5 py-4">
              <div>
                <p className="text-sm font-medium text-text">Pomodoro alerts</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">Know when a focus session or break ends.</p>
              </div>
              <Toggle
                checked={settings.pomodoroAlerts}
                onChange={(v) => void toggleReminderSetting('pomodoroAlerts', v)}
                disabled={permission === 'unsupported'}
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
