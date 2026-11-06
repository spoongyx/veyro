import type { AppNotificationSettings, Task } from '@/lib/types';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

const SETTINGS_KEY = 'veyro-notif-settings';

export const DEFAULT_NOTIFICATION_SETTINGS: AppNotificationSettings = {
  reminders: true,
  pomodoroAlerts: true,
  dailySummary: false,
};

export function loadNotificationSettings(): AppNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: AppNotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function areTaskRemindersEnabled(): boolean {
  return loadNotificationSettings().reminders;
}

export function arePomodoroAlertsEnabled(): boolean {
  return loadNotificationSettings().pomodoroAlerts;
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof window.Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function showAppNotification(title: string, options?: { body?: string; tag?: string }): Promise<void> {
  if (typeof window === 'undefined') return;
  const permission =
    typeof window.Notification !== 'undefined' ? window.Notification.permission : 'default';
  if (permission !== 'granted') return;

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification(title, { body: options?.body, tag: options?.tag });
        return;
      }
    }
  } catch {
    // fall through to direct Notification
  }

  if (typeof window.Notification !== 'undefined') {
    new window.Notification(title, { body: options?.body, tag: options?.tag });
  }
}

const NOTIFIED_KEY = 'veyro-notified-reminders-v2';

export function getNotifiedReminderKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addNotifiedReminderKeys(keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(new Set([...getNotifiedReminderKeys(), ...keys]))));
  } catch {
    // ignore
  }
}

export const REMINDER_GRACE_MS = 30 * 60 * 1000;

export function canShowNotifications(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.Notification !== 'undefined' &&
    window.Notification.permission === 'granted'
  );
}

export function checkTaskReminders(
  tasks: Task[],
  onNotify: (task: Task, remindAt: Date) => void
): string[] {
  if (!canShowNotifications()) return [];

  const now = Date.now();
  const keys = getNotifiedReminderKeys();
  const notified: string[] = [];

  for (const task of tasks) {
    if (task.status === 'done') continue;
    if (!task.reminder_time) continue;
    const remindAt = new Date(task.reminder_time).getTime();
    if (isNaN(remindAt)) continue;

    const age = now - remindAt;
    if (age < 0) continue;
    if (age > REMINDER_GRACE_MS) continue;

    const key = `${task.id}:${new Date(remindAt).toISOString()}`;
    if (keys.includes(key)) continue;

    try {
      onNotify(task, new Date(remindAt));
      notified.push(key);
    } catch {
      // Leave the key unmarked so it can retry.
    }
  }

  if (notified.length) addNotifiedReminderKeys(notified);
  return notified;
}
