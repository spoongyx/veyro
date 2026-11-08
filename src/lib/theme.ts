export type Theme = 'light' | 'midnight';

export const DEFAULT_THEME: Theme = 'midnight';
export const THEME_STORAGE_KEY = 'ascned-theme';
export const THEME_COOKIE = 'ascned-theme';
export const THEME_PENDING_KEY = 'ascned-theme-pending';
const LEGACY_THEME_STORAGE_KEY = 'veyro-theme';
const LEGACY_THEME_COOKIE = 'veyro-theme';

export const THEME_META: Record<
  Theme,
  { label: string; description: string; color: string; dot: string }
> = {
  light: {
    label: 'Light',
    description: 'Warm white surfaces with deep navy accents.',
    color: '#F7F6F2',
    dot: '#10264A',
  },
  midnight: {
    label: 'Midnight',
    description: 'Deep charcoal surfaces with warm orange accents.',
    color: '#121212',
    dot: '#FF8A32',
  },
};

export function normalizeTheme(value: unknown): Theme | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'light') return 'light';
  if (normalized === 'midnight' || normalized === 'dark' || normalized === 'default') return 'midnight';
  return null;
}

export function themeFromUser(user: unknown): Theme | null {
  if (!user || typeof user !== 'object') return null;
  const metadata = (user as { user_metadata?: unknown }).user_metadata;
  if (!metadata || typeof metadata !== 'object') return null;
  return normalizeTheme((metadata as { theme?: unknown }).theme);
}

export function readThemeCookie(): Theme | null {
  if (typeof document === 'undefined') return null;
  const match =
    document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`)) ??
    document.cookie.match(new RegExp(`(?:^|; )${LEGACY_THEME_COOKIE}=([^;]*)`));
  if (!match) return null;
  try {
    return normalizeTheme(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const local = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (local) return local;
    const legacy = normalizeTheme(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
    if (legacy) {
      window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
      return legacy;
    }
  } catch {
    // localStorage may be unavailable; fall through to the cookie.
  }
  return readThemeCookie() ?? DEFAULT_THEME;
}

export function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures; the cookie below is a secondary fallback.
  }
  try {
    document.cookie = `${THEME_COOKIE}=${encodeURIComponent(theme)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Ignore cookie failures.
  }
}

export function applyTheme(theme: Theme, options?: { transition?: boolean }): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.remove('dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META[theme].color);

  if (options?.transition !== false) {
    window.requestAnimationFrame(() => root.classList.add('theme-ready'));
  }
}

export function setPendingThemeSync(pending: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (pending) window.localStorage.setItem(THEME_PENDING_KEY, '1');
    else window.localStorage.removeItem(THEME_PENDING_KEY);
  } catch {
    // Ignore.
  }
}

export function hasPendingThemeSync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(THEME_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}
