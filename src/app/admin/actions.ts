'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createUserClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { volunteerOrError, DEMO_NOTE } from '@/lib/auth';
import { slugify, validateOpportunity, type FieldErrors } from '@/lib/validation';
import { todayInIreland } from '@/lib/status';
import { checkPage, checkPageCached, type CheckResult } from '@/lib/monitor/check';
import { recordCheck } from '@/lib/monitor/record';
import { politeFetch, parsePublicUrl } from '@/lib/monitor/fetch';
import { extractPage, type DraftSuggestion } from '@/lib/monitor/extract';
import { SOURCE_KINDS, DEMO_SOURCES } from '@/lib/monitor/sources';

export interface FormState { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string>; seq?: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refresh = (slug?: string) => { revalidatePath('/'); revalidatePath('/opportunities'); if (slug) revalidatePath(`/opportunities/${slug}`); revalidatePath('/admin', 'layout'); };
const demoDone = (what: string): FormState => ({ ok: true, message: `${what} ${DEMO_NOTE}`, seq: Date.now() });

/* ---------------------------------------------------------------- Authentication */
export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) redirect('/admin');
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
  redirect(isSupabaseConfigured() ? '/admin/login' : '/');
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
  if (auth.ctx.mode === 'demo') return demoDone('Passwords are set by each volunteer.');
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
  const ctx = auth.ctx;
  const id = String(fd.get('id') ?? '');
  const intent = String(fd.get('intent') ?? 'save');
  const values = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$')).map(([k, v]) => [k, String(v)]));

  const { data, errors } = validateOpportunity(fd);
  if (!data) return { errors, message: 'Please correct the highlighted fields.', values, seq: Date.now() };
  if (ctx.mode === 'demo') return { ...demoDone(intent === 'publish' ? 'This listing passed every check and would now be published.' : 'This listing passed every check and would now be saved.'), values };
  if (id && !UUID.test(id)) return { message: 'This listing could not be found.' };

  const { supabase, user } = ctx;
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

  const suggestionId = String(fd.get('suggestion_id') ?? '');
  const base = slugify(data.employer, data.programme_name);
  for (let n = 1; n <= 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data: created, error } = await supabase.from('opportunities').insert({ ...row, slug, publication: row.publication ?? 'draft' }).select('id, slug').single();
    if (!error) {
      if (UUID.test(suggestionId)) await supabase.from('suggestions').update({ status: 'accepted', opportunity_id: created.id, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', suggestionId);
      refresh(created.slug); redirect(`/admin/opportunities/${created.id}?created=1`);
    }
    if (error.code !== '23505') return { message: 'Could not create the listing: ' + error.message, values, seq: Date.now() };
  }
  return { message: 'Could not create a unique web address for this listing. Try a slightly different programme name.' };
}

async function updateOne(id: string, change: Record<string, unknown>, done: string): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  if (auth.ctx.mode === 'demo') return demoDone(done);
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
  if (auth.ctx.mode === 'demo') return demoDone('Marked as verified today.');
  return updateOne(String(fd.get('id')), { last_verified_on: todayInIreland(), verified_by: auth.ctx.user.id }, 'Marked as verified today.');
}

export async function deleteOpportunity(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  if (auth.ctx.role !== 'admin') return { message: 'Only admins can delete listings. Archive it instead.' };
  if (fd.get('confirm') !== 'DELETE') return { message: 'Type DELETE to confirm.' };
  if (auth.ctx.mode === 'demo') return demoDone('The listing would now be deleted.');
  const id = String(fd.get('id'));
  if (!UUID.test(id)) return { message: 'This listing could not be found.' };
  const { data, error } = await auth.ctx.supabase.from('opportunities').delete().eq('id', id).select('slug');
  if (error) return { message: 'Could not delete: ' + error.message };
  if (!data?.length) return { message: 'This listing could not be deleted.' };
  refresh(data[0].slug);
  redirect('/admin/listings?deleted=1');
}

/* ---------------------------------------------------------------- Watched sources */
export interface SourceCheckState { ok?: boolean; message?: string; result?: Omit<CheckResult, 'snapshot' | 'hash'> }

/** The page snapshot and hash stay on the server. */
function forClient(r: CheckResult): Omit<CheckResult, 'snapshot' | 'hash'> {
  const out: Partial<CheckResult> = { ...r }; delete out.snapshot; delete out.hash;
  return out as Omit<CheckResult, 'snapshot' | 'hash'>;
}

/** Check one watched source now. Live: compares with the stored copy and records it. Demo: a real, live fetch; nothing saved. */
export async function checkSource(_: SourceCheckState, fd: FormData): Promise<SourceCheckState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const id = String(fd.get('id') ?? '');
  if (auth.ctx.mode === 'demo') {
    const src = DEMO_SOURCES.find(s => s.id === id); if (!src) return { message: 'Unknown source.' };
    const result = forClient(await checkPageCached(src.url));
    return { ok: result.status !== 'error', message: result.message, result };
  }
  if (!UUID.test(id)) return { message: 'Unknown source.' };
  const { supabase, user } = auth.ctx;
  const { data: src } = await supabase.from('sources').select('id,url,content_hash,snapshot').eq('id', id).maybeSingle();
  if (!src) return { message: 'Unknown source.' };
  const r = await checkPage(src.url, { hash: src.content_hash, snapshot: src.snapshot });
  try { await recordCheck(supabase, src.id, r, user.id); } catch (e) { return { message: (e as Error).message }; }
  revalidatePath('/admin', 'layout');
  return { ok: r.status !== 'error', message: r.message, result: forClient(r) };
}

export async function addSource(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const name = String(fd.get('name') ?? '').trim(), raw = String(fd.get('url') ?? '').trim(), kind = String(fd.get('kind') ?? '');
  const days = Number(fd.get('check_every_days') ?? 7), notes = String(fd.get('notes') ?? '').trim() || null;
  const errors: FieldErrors = {};
  if (name.length < 2 || name.length > 120) errors.name = 'Give the source a name (2–120 characters).';
  const url = parsePublicUrl(raw); if (!url) errors.url = 'Enter a full public web address starting with https://';
  if (!(kind in SOURCE_KINDS)) errors.kind = 'Choose what kind of page this is.';
  if (![1, 3, 7, 14, 30].includes(days)) errors.check_every_days = 'Choose how often to check.';
  if (notes && notes.length > 500) errors.notes = 'Keep notes under 500 characters.';
  if (Object.keys(errors).length) return { errors, message: 'Please correct the highlighted fields.' };
  if (auth.ctx.mode === 'demo') return demoDone('This source would now be watched.');
  const { error } = await auth.ctx.supabase.from('sources').insert({ name, url: url!.toString(), kind, check_every_days: days, notes });
  if (error) return { message: error.code === '23505' ? 'That page is already being watched.' : 'Could not add the source: ' + error.message };
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Source added. Use “Check now” to take the first snapshot.', seq: Date.now() };
}

export async function sourceAction(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const id = String(fd.get('id') ?? ''), what = String(fd.get('do') ?? '');
  const done = ({ reviewed: 'Marked as reviewed.', pause: 'Checks paused for this source.', resume: 'Checks resumed.', remove: 'Source removed.' } as Record<string, string>)[what];
  if (!done) return { message: 'Unknown action.' };
  if (auth.ctx.mode === 'demo') return demoDone(done);
  if (!UUID.test(id)) return { message: 'Unknown source.' };
  const q = auth.ctx.supabase.from('sources');
  const { error } = what === 'remove' ? await q.delete().eq('id', id) : await q.update(what === 'reviewed' ? { last_status: 'unchanged' } : { active: what === 'resume' }).eq('id', id);
  if (error) return { message: 'Could not update: ' + error.message };
  revalidatePath('/admin', 'layout');
  return { ok: true, message: done, seq: Date.now() };
}

/* ---------------------------------------------------------------- Import from a link, and the suggestions inbox */
export interface ImportState { ok?: boolean; message?: string; url?: string; title?: string; suggestions?: DraftSuggestion[]; dateHints?: string[] }

const recent = new Map<string, number[]>();
function rateLimited(key: string, max = 10, perMs = 60_000) {
  const now = Date.now(), hits = (recent.get(key) ?? []).filter(t => now - t < perMs);
  hits.push(now); recent.set(key, hits); if (recent.size > 5000) recent.clear();
  return hits.length > max;
}

export async function importFromUrl(_: ImportState, fd: FormData): Promise<ImportState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const raw = String(fd.get('url') ?? '').trim();
  const h = await headers();
  if (rateLimited(h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon')) return { message: 'Please wait a minute before importing more pages.', url: raw };
  const res = await politeFetch(raw);
  if (!res.ok) return { message: res.message, url: raw };
  const page = extractPage(res.html, res.url);
  const structured = page.suggestions.some(s => s.kind === 'structured');
  return {
    ok: true, url: res.url, title: page.title, suggestions: page.suggestions, dateHints: page.dateHints,
    message: structured ? 'Found structured job details on this page. Review each field before saving.' : 'This page has no structured job details, so only basic information was found. Fill in the rest from the page itself.',
  };
}

export async function dismissSuggestion(_: FormState, fd: FormData): Promise<FormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  if (auth.ctx.mode === 'demo') return demoDone('Suggestion dismissed.');
  const id = String(fd.get('id') ?? ''); if (!UUID.test(id)) return { message: 'Unknown suggestion.' };
  const { error } = await auth.ctx.supabase.from('suggestions').update({ status: 'dismissed', reviewed_by: auth.ctx.user.id, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return { message: 'Could not dismiss: ' + error.message };
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Dismissed.', seq: Date.now() };
}
