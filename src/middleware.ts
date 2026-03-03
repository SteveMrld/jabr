import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase not configured, allow everything (dev/demo mode)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
      setAll: (cookies) => {
        for (const cookie of cookies) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Protected routes: redirect to /auth if not logged in
  if (pathname.startsWith('/demo') && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Already logged in: redirect /auth to /demo
  if (pathname.startsWith('/auth') && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/demo';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/demo/:path*', '/auth/:path*'],
};
