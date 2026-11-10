import 'server-only';
import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createUserClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';

export type Role = 'editor' | 'admin';

/**
 * Live: a signed-in volunteer, checked against admin_users. Row-level security enforces the same rules again.
 * Demo: used only when no database is configured — a read-only walkthrough where nothing is saved.
 */
export type VolunteerCtx =
  | { mode: 'live'; supabase: SupabaseClient; user: User; role: Role }
  | { mode: 'demo'; user: { email: string }; role: Role };

export const isDemo = () => !isSupabaseConfigured();
const DEMO: VolunteerCtx = { mode: 'demo', user: { email: 'demo volunteer' }, role: 'admin' };

/** Use at the top of every admin page. getUser() validates the session with Supabase on every call. */
export async function requireVolunteer(): Promise<VolunteerCtx> {
  if (isDemo()) return DEMO;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: member } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!member) redirect('/admin/not-authorised');
  return { mode: 'live', supabase, user, role: member.role as Role };
}

/** For server actions: same checks, but returns an error instead of redirecting mid-action. */
export async function volunteerOrError(): Promise<{ ok: true; ctx: VolunteerCtx } | { ok: false; error: string }> {
  if (isDemo()) return { ok: true, ctx: DEMO };
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Your session has ended. Please sign in again.' };
  const { data: member } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!member) return { ok: false, error: 'Your account is not authorised to manage listings.' };
  return { ok: true, ctx: { mode: 'live', supabase, user, role: member.role as Role } };
}

export const DEMO_NOTE = 'Demo mode: nothing you do here is saved.';
