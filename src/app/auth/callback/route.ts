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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return redirect(request, `/auth/login?error=${encodeURIComponent(error)}`);
  }
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return redirect(request, `/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
    return redirect(request, '/app/dashboard');
  }

  return redirect(request, '/auth/login');
}
