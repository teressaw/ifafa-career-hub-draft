import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createUserClient } from '@/lib/supabase/server';

/** Handles links in invitation and password-reset emails (see README: email templates). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next') ?? '/admin/account';
  // Only allow redirects within the admin area (prevents open redirects).
  const next = /^\/admin(\/[a-z0-9/-]*)?$/i.test(nextParam) ? nextParam : '/admin/account';
  const target = request.nextUrl.clone();
  target.search = '';
  if (token_hash && type && ['invite', 'recovery', 'email', 'magiclink'].includes(type)) {
    const supabase = await createUserClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) { target.pathname = next; return NextResponse.redirect(target); }
  }
  target.pathname = '/admin/login';
  target.searchParams.set('link', 'expired');
  return NextResponse.redirect(target);
}
