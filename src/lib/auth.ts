import 'server-only';
import { redirect } from 'next/navigation';
import { createUserClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';

export type Role = 'editor' | 'admin';

/**
 * Use at the top of every admin page and server action.
 * getUser() validates the session with Supabase on every call (it does not trust the cookie alone).
 * The database's row-level security enforces the same rules again.
 */
export async function requireVolunteer() {
  if (!isSupabaseConfigured()) redirect('/admin/setup');
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: member } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!member) redirect('/admin/not-authorised');
  return { supabase, user, role: member.role as Role };
}

/** For server actions: same checks, but returns an error instead of redirecting mid-action. */
export async function volunteerOrError(): Promise<{ ok: true; ctx: Awaited<ReturnType<typeof requireVolunteer>> } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'The database is not connected.' };
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Your session has ended. Please sign in again.' };
  const { data: member } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!member) return { ok: false, error: 'Your account is not authorised to manage listings.' };
  return { ok: true, ctx: { supabase, user, role: member.role as Role } };
}
