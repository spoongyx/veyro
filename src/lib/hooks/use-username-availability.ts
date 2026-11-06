'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizeUsername, validateUsername } from '@/lib/profile';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameAvailability(
  value: string,
  excludeId?: string,
  initialUsername?: string | null
): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    const username = normalizeUsername(value);
    const unchanged =
      initialUsername && username.toLowerCase() === initialUsername.trim().toLowerCase();

    if (!username || unchanged) {
      setStatus('idle');
      return;
    }
    if (validateUsername(username)) {
      setStatus('invalid');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    const timer = window.setTimeout(() => {
      const supabase = createClient();
      void supabase
        .rpc('username_available', {
          candidate: username,
          exclude_id: excludeId ?? null,
        })
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setStatus('error');
            return;
          }
          setStatus(data ? 'available' : 'taken');
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, excludeId, initialUsername]);

  return status;
}
