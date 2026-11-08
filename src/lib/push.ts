'use client';

import { createClient } from '@/lib/supabase/client';
import { loadNotificationSettings } from '@/lib/notifications';

export type PushAvailability = 'ready' | 'install-required' | 'unsupported';

export type PushSetupResult =
  | { ok: true }
  | { ok: false; message: string };

interface EnsurePushOptions {
  requestPermission?: boolean;
  remindersEnabled?: boolean;
}

let syncPromise: Promise<PushSetupResult> | null = null;

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    iosNavigator.standalone === true
  );
}

export function getPushAvailability(): PushAvailability {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIosDevice() && !isStandalone()) return 'install-required';
  if (
    typeof window.Notification === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return 'unsupported';
  }
  return 'ready';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

async function getPublicKey(): Promise<string> {
  const response = await fetch('/api/push/public-key', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Background reminders are not configured yet. Try again later.');
  }
  const data = (await response.json()) as { publicKey?: string };
  if (!data.publicKey) {
    throw new Error('Background reminders are not configured yet. Try again later.');
  }
  return data.publicKey;
}

async function savePushSubscription(
  subscription: PushSubscription,
  remindersEnabled: boolean
): Promise<void> {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error('This browser did not return a complete push subscription.');
  }

  const supabase = createClient();
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_user_agent: navigator.userAgent,
    p_reminders_enabled: remindersEnabled,
  });

  if (error) {
    throw new Error(error.message || 'Could not save this device for reminders.');
  }
}

async function setupPush(options: EnsurePushOptions): Promise<PushSetupResult> {
  const availability = getPushAvailability();
  if (availability === 'install-required') {
    return {
      ok: false,
      message:
        'On iPhone, add Ascned to your Home Screen first, then open the installed app and enable reminders there.',
    };
  }
  if (availability === 'unsupported') {
    return {
      ok: false,
      message: 'This browser does not support background notifications.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      ok: false,
      message: 'Notifications are blocked. Allow them in your browser settings, then try again.',
    };
  }

  if (Notification.permission === 'default') {
    if (!options.requestPermission) {
      return {
        ok: false,
        message: 'Tap Enable background reminders to allow notifications for Ascned.',
      };
    }
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      return {
        ok: false,
        message: 'Could not ask for notification permission. Try again from the settings page.',
      };
    }
    if (permission !== 'granted') {
      return {
        ok: false,
        message: 'Notifications were not allowed, so background reminders are still off.',
      };
    }
  }

  try {
    const registration = await getServiceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicKey = await getPublicKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    await savePushSubscription(
      subscription,
      options.remindersEnabled ?? loadNotificationSettings().reminders
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Could not set up background reminders. Try again.',
    };
  }
}

export function ensurePushSubscription(options: EnsurePushOptions = {}): Promise<PushSetupResult> {
  return setupPush(options);
}

export function enablePushNotifications(): Promise<PushSetupResult> {
  return setupPush({ requestPermission: true, remindersEnabled: true });
}

export function syncPushSubscription(): Promise<PushSetupResult> {
  if (!syncPromise) {
    syncPromise = setupPush({ requestPermission: false }).finally(() => {
      syncPromise = null;
    });
  }
  return syncPromise;
}

export async function setPushRemindersEnabled(enabled: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('set_push_reminders_enabled', {
    p_enabled: enabled,
  });
  if (error) {
    throw new Error(error.message || 'Could not update reminder settings.');
  }
}

export async function hasPushSubscription(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

export async function removePushSubscription(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    try {
      const supabase = createClient();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    } catch {
      // Removing the browser subscription below is enough; the server prunes stale endpoints.
    }

    try {
      await subscription.unsubscribe();
    } catch {
      // Ignore unsubscribe failures; the endpoint is already treated as stale.
    }
  } catch {
    // Service worker support is optional for sign-out.
  }
}
