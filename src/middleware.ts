import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (
    pathname === '/' &&
    (searchParams.has('code') || searchParams.has('error') || searchParams.has('error_description'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  let supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCallbackRoute = pathname.startsWith('/auth/callback');
  const isResetRoute = pathname.startsWith('/auth/reset-password');
  const isAuthRoute = pathname.startsWith('/auth') && !isCallbackRoute && !isResetRoute;
  const isAppRoute = pathname.startsWith('/app');

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/app/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/app/:path*', '/auth/:path*'],
};
