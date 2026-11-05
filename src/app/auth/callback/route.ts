import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getAppOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall back to the request origin if the configured URL is invalid.
    }
  }
  return new URL(request.url).origin;
}

function redirect(request: Request, path: string): NextResponse {
  const response = NextResponse.redirect(`${getAppOrigin(request)}${path}`);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function safeNext(value: string | null): string {
  if (!value) return '/app/dashboard';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/app/dashboard';
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const next = safeNext(searchParams.get('next'));

  if (error) {
    return redirect(request, `/auth/login?error=${encodeURIComponent(error)}`);
  }
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return redirect(request, `/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
    return redirect(request, next);
  }

  return redirect(request, '/auth/login');
}
