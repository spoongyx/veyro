'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { fetchTasks } from '@/lib/db';
import { areTaskRemindersEnabled, checkTaskReminders, showAppNotification } from '@/lib/notifications';
import type { Task } from '@/lib/types';

const CHECK_INTERVAL_MS = 15_000;
const REFRESH_INTERVAL_MS = 60_000;

export default function ReminderWatcher() {
  const { user } = useAuth();
  const tasksRef = useRef<Task[]>([]);
  const busyRef = useRef(false);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      tasksRef.current = [];
      return;
    }

    let disposed = false;

    const runCheck = () => {
      if (!areTaskRemindersEnabled()) return;
      checkTaskReminders(tasksRef.current, (task, remindAt) => {
        void showAppNotification(`Reminder: ${task.title}`, {
          body: `Due at ${remindAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`,
          tag: `task-${task.id}`,
        });
      });
    };

    const refresh = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const tasks = await fetchTasks(userId);
        if (!disposed) {
          tasksRef.current = tasks;
          runCheck();
        }
      } catch {
        // Keep the last known task list and retry on the next interval.
      } finally {
        busyRef.current = false;
      }
    };

    void refresh();

    const checkTimer = window.setInterval(runCheck, CHECK_INTERVAL_MS);
    const refreshTimer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onTasksChanged = () => void refresh();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('ascned:tasks-changed', onTasksChanged);

    return () => {
      disposed = true;
      window.clearInterval(checkTimer);
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('ascned:tasks-changed', onTasksChanged);
    };
  }, [user?.id]);

  return null;
}
