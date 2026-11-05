export function authCallbackUrl(next?: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
  const url = new URL('/auth/callback', origin);
  if (next) url.searchParams.set('next', next);
  return url.toString();
}
