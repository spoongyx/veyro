export interface QueuedOp {
  id: string;
  entity: string;
  action: string;
  payload: unknown;
  created_at: string;
}

const PREFIX = 'ascned-offline-';
const LEGACY_PREFIX = 'veyro-offline-';

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function readCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw =
      window.localStorage.getItem(PREFIX + key) ?? window.localStorage.getItem(LEGACY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeCache<T>(key: string, value: T): T {
  if (typeof window === 'undefined') return value;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full / unavailable — fail silently
  }
  return value;
}

export function getQueue(): QueuedOp[] {
  return readCache<QueuedOp[]>('queue', []);
}

export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PREFIX + 'queue');
  window.localStorage.removeItem(LEGACY_PREFIX + 'queue');
}

export function enqueueOp(op: { entity: string; action: string; payload: unknown }): void {
  const queue = getQueue();
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    created_at: new Date().toISOString(),
  });
  writeCache('queue', queue.slice(-50));
}

export async function flushOfflineQueue(userId: string): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  let synced = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const { createClient } = await import('./supabase/client');
      const sb = createClient();
      if (op.entity === 'tasks' && op.action === 'upsert') {
        const { error } = await sb.from('tasks').upsert({ ...(op.payload as object), user_id: userId });
        if (error) throw error;
      } else if (op.entity === 'habits' && op.action === 'upsert') {
        const { error } = await sb.from('habits').upsert({ ...(op.payload as object), user_id: userId });
        if (error) throw error;
      } else if (op.entity === 'goals' && op.action === 'upsert') {
        const { error } = await sb.from('goals').upsert({ ...(op.payload as object), user_id: userId });
        if (error) throw error;
      } else if (op.entity === 'focus_sessions' && op.action === 'insert') {
        const { error } = await sb.from('focus_sessions').insert({ ...(op.payload as object), user_id: userId });
        if (error) throw error;
      } else if (op.entity === 'habit_completions' && op.action === 'delete') {
        const { error } = await sb.from('habit_completions').delete().eq('id', (op.payload as { id: string }).id);
        if (error) throw error;
      }
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  if (queue.length) clearQueue();
  return { synced, failed };
}

export function clearCachedData(keys: string[]): void {
  if (typeof window === 'undefined') return;
  keys.forEach((k) => {
    window.localStorage.removeItem(PREFIX + k);
    window.localStorage.removeItem(LEGACY_PREFIX + k);
  });
}

export function clearOfflineData(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX) || key.startsWith(LEGACY_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
