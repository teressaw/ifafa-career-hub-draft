import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Keeps volunteers' Supabase sessions fresh on admin routes, and sends signed-out visitors to the login page.
 * This is a convenience layer only: every admin page and server action re-checks the user and their role,
 * and row-level security in the database is the final guard.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicAdminPage = ['/admin/login', '/admin/forgot-password', '/admin/setup'].includes(path);
  if (!user && path.startsWith('/admin') && !isPublicAdminPage) {
    const login = request.nextUrl.clone();
    login.pathname = '/admin/login';
    login.search = '';
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = { matcher: ['/admin/:path*', '/auth/:path*'] };
