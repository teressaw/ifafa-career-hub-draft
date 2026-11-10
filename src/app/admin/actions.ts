'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createUserClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { volunteerOrError } from '@/lib/auth';
import { slugify, validateOpportunity, type FieldErrors } from '@/lib/validation';
import { todayInIreland } from '@/lib/status';

export interface FormState { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string>; seq?: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refresh = (slug?: string) => { revalidatePath('/'); revalidatePath('/opportunities'); if (slug) revalidatePath(`/opportunities/${slug}`); revalidatePath('/admin'); };

/* ---------------------------------------------------------------- Authentication */
export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { message: 'The database is not connected yet.' };
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) return { message: 'Enter your email address and password.' };
  const supabase = await createUserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Deliberately vague: don't reveal whether an account exists.
  if (error) return { message: 'That email and password combination did not work. Please try again, or reset your password.' };
  redirect('/admin');
}

export async function signOut() {
  if (isSupabaseConfigured()) await (await createUserClient()).auth.signOut();
  redirect('/admin/login');
}

async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { message: 'The database is not connected yet.' };
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: 'Enter a valid email address.' };
  const supabase = await createUserClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteOrigin()}/auth/confirm?next=/admin/account` });
  return { ok: true, message: 'If that address belongs to a volunteer account, a reset link is on its way. It may take a few minutes.' };
}

export async function updatePassword(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const password = String(fd.get('password') ?? ''), confirm = String(fd.get('confirm') ?? '');
  if (password.length < 12) return { errors: { password: 'Use at least 12 characters.' } };
  if (password !== confirm) return { errors: { confirm: 'The passwords do not match.' } };
  const { error } = await auth.ctx.supabase.auth.updateUser({ password });
  if (error) return { message: 'Your password could not be updated: ' + error.message };
  return { ok: true, message: 'Your password has been updated.' };
}

/* ---------------------------------------------------------------- Listings */
export async function saveOpportunity(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const { supabase, user } = auth.ctx;
  const id = String(fd.get('id') ?? '');
  if (id && !UUID.test(id)) return { message: 'This listing could not be found.' };
  const intent = String(fd.get('intent') ?? 'save');

  const { data, errors } = validateOpportunity(fd);
  const values = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$')).map(([k, v]) => [k, String(v)]));
  if (!data) return { errors, message: 'Please correct the highlighted fields.', values, seq: Date.now() };

  const { verified_today, ...fields } = data;
  const row: Record<string, unknown> = { ...fields };
  if (verified_today) { row.last_verified_on = todayInIreland(); row.verified_by = user.id; }
  if (intent === 'publish') row.publication = 'published';

  if (id) {
    const { data: saved, error } = await supabase.from('opportunities').update(row).eq('id', id).select('id, slug').maybeSingle();
    if (error) return { message: 'Could not save: ' + error.message, values, seq: Date.now() };
    if (!saved) return { message: 'This listing could not be found, or you do not have permission to change it.' };
    refresh(saved.slug);
    return { ok: true, message: intent === 'publish' ? 'Saved and published.' : 'Changes saved.', seq: Date.now() };
  }

  // New listing: create a readable, unique URL.
  const base = slugify(data.employer, data.programme_name);
  for (let n = 1; n <= 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data: created, error } = await supabase.from('opportunities').insert({ ...row, slug, publication: row.publication ?? 'draft' }).select('id, slug').single();
    if (!error) { refresh(created.slug); redirect(`/admin/opportunities/${created.id}?created=1`); }
    if (error.code !== '23505') return { message: 'Could not create the listing: ' + error.message, values, seq: Date.now() };
  }
  return { message: 'Could not create a unique web address for this listing. Try a slightly different programme name.' };
}

async function updateOne(id: string, change: Record<string, unknown>, done: string): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  if (!UUID.test(id)) return { message: 'This listing could not be found.' };
  const { data, error } = await auth.ctx.supabase.from('opportunities').update(change).eq('id', id).select('slug').maybeSingle();
  if (error) return { message: 'Could not update: ' + error.message };
  if (!data) return { message: 'This listing could not be found, or you do not have permission to change it.' };
  refresh(data.slug);
  return { ok: true, message: done };
}

export async function setPublication(_: FormState, fd: FormData): Promise<FormState> {
  const state = String(fd.get('state'));
  if (!['draft', 'published', 'archived'].includes(state)) return { message: 'Unknown action.' };
  const msg = { draft: 'Moved back to drafts. It is no longer visible to the public.', published: 'Published. It is now visible in the directory.', archived: 'Archived. It is no longer visible to the public.' }[state as 'draft'];
  return updateOne(String(fd.get('id')), { publication: state }, msg);
}

export async function markVerified(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('confirm') !== 'on') return { message: 'Please confirm that you checked the official source today.' };
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  return updateOne(String(fd.get('id')), { last_verified_on: todayInIreland(), verified_by: auth.ctx.user.id }, 'Marked as verified today.');
}

export async function deleteOpportunity(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  if (auth.ctx.role !== 'admin') return { message: 'Only admins can delete listings. Archive it instead.' };
  const id = String(fd.get('id'));
  if (!UUID.test(id)) return { message: 'This listing could not be found.' };
  if (fd.get('confirm') !== 'DELETE') return { message: 'Type DELETE to confirm.' };
  const { data, error } = await auth.ctx.supabase.from('opportunities').delete().eq('id', id).select('slug');
  if (error) return { message: 'Could not delete: ' + error.message };
  if (!data?.length) return { message: 'This listing could not be deleted.' };
  refresh(data[0].slug);
  redirect('/admin?deleted=1');
}
