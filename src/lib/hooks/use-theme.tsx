'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_THEME,
  applyTheme,
  getStoredTheme,
  hasPendingThemeSync,
  persistTheme,
  setPendingThemeSync,
  themeFromUser,
  type Theme,
} from '@/lib/theme';

export type ThemeSyncState = 'local' | 'syncing' | 'synced' | 'error';

interface ThemeContextValue {
  theme: Theme;
  ready: boolean;
  syncState: ThemeSyncState;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<ThemeSyncState>('local');
  const themeRef = useRef<Theme>(DEFAULT_THEME);

  const applyLocalTheme = useCallback((next: Theme) => {
    themeRef.current = next;
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, []);

  useEffect(() => {
    const stored = getStoredTheme();
    themeRef.current = stored;
    setThemeState(stored);
    applyTheme(stored, { transition: false });
    setReady(true);
    const raf = window.requestAnimationFrame(() => document.documentElement.classList.add('theme-ready'));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      applyLocalTheme(next);
      setSyncState('syncing');

      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setSyncState('local');
          return;
        }
        void supabase.auth
          .updateUser({ data: { theme: next } })
          .then(({ error }) => {
            if (error) {
              setPendingThemeSync(true);
              setSyncState('error');
              return;
            }
            setPendingThemeSync(false);
            setSyncState('synced');
          });
      });
    },
    [applyLocalTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(themeRef.current === 'midnight' ? 'light' : 'midnight');
  }, [setTheme]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const syncUser = async (user: unknown) => {
      if (!active) return;
      if (!user) {
        setSyncState('local');
        return;
      }

      const remote = themeFromUser(user);
      if (remote) {
        if (remote !== themeRef.current) applyLocalTheme(remote);
        setPendingThemeSync(false);
        setSyncState('synced');
        return;
      }

      setSyncState('syncing');
      const { error } = await supabase.auth.updateUser({ data: { theme: themeRef.current } });
      if (!active) return;
      if (error) {
        setPendingThemeSync(true);
        setSyncState('error');
      } else {
        setPendingThemeSync(false);
        setSyncState('synced');
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (active) void syncUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setSyncState('local');
        return;
      }
      if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED'
      ) {
        void syncUser(session?.user ?? null);
      }
    });

    const retryPendingSync = () => {
      if (!active || !hasPendingThemeSync()) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (active && data.session) void syncUser(data.session.user);
      });
    };

    window.addEventListener('online', retryPendingSync);
    return () => {
      active = false;
      window.removeEventListener('online', retryPendingSync);
      subscription.unsubscribe();
    };
  }, [applyLocalTheme]);

  const value = useMemo(
    () => ({ theme, ready, syncState, setTheme, toggleTheme }),
    [theme, ready, syncState, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
