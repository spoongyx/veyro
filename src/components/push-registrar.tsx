'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { loadNotificationSettings } from '@/lib/notifications';
import { setPushRemindersEnabled, syncPushSubscription } from '@/lib/push';

export default function PushRegistrar() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    if (!loadNotificationSettings().reminders) {
      void setPushRemindersEnabled(false).catch(() => {
        // Offline or signed out; the next sign-in will retry.
      });
      return;
    }

    if (typeof window.Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    void syncPushSubscription();
  }, [user]);

  return null;
}
