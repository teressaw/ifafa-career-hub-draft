'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { volunteerOrError, DEMO_NOTE } from '@/lib/auth';
import { todayInIreland } from '@/lib/status';
import { RESOURCE_KINDS, validateResource, type ResourceErrors, type ResourceKind } from '@/lib/resources';

export interface ResourceFormState { ok?: boolean; message?: string; errors?: ResourceErrors; values?: Record<string, string | string[]>; seq?: number }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refresh = (kind?: ResourceKind) => { revalidatePath('/'); if (kind) revalidatePath(RESOURCE_KINDS[kind].href); revalidatePath('/admin', 'layout'); };

export async function saveResource(_: ResourceFormState, fd: FormData): Promise<ResourceFormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const id = String(fd.get('id') ?? ''), intent = String(fd.get('intent') ?? 'save');
  const values: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string' && !k.startsWith('$')) values[k] = k === 'audiences' ? [...((values[k] as string[]) ?? []), v] : v;
  const { data, errors } = validateResource(fd, todayInIreland());
  if (!data) return { errors, message: 'Please correct the highlighted fields.', values, seq: Date.now() };
  if (auth.ctx.mode === 'demo') return { ok: true, message: `This item passed every check and would now be ${intent === 'publish' ? 'published' : 'saved'}. ${DEMO_NOTE}`, values, seq: Date.now() };
  if (id && !UUID.test(id)) return { message: 'This item could not be found.' };

  const { verified_today, ...row } = data;
  const record: Record<string, unknown> = { ...row };
  if (verified_today) record.last_verified_on = todayInIreland();
  if (intent === 'publish') record.publication = 'published';
  const db = auth.ctx.supabase.from('resources');
  const { data: saved, error } = id
    ? await db.update(record).eq('id', id).select('id').maybeSingle()
    : await db.insert({ ...record, publication: record.publication ?? 'draft' }).select('id').single();
  if (error) return { message: 'Could not save: ' + error.message, values, seq: Date.now() };
  if (!saved) return { message: 'This item could not be found, or you do not have permission to change it.' };
  refresh(data.kind);
  if (!id) redirect(`/admin/resources/${saved.id}?created=1`);
  return { ok: true, message: intent === 'publish' ? 'Saved and published.' : 'Changes saved.', seq: Date.now() };
}

export async function resourceAction(_: ResourceFormState, fd: FormData): Promise<ResourceFormState> {
  const auth = await volunteerOrError(); if (!auth.ok) return { message: auth.error };
  const id = String(fd.get('id') ?? ''), what = String(fd.get('do') ?? '');
  const done = ({ publish: 'Published.', unpublish: 'Moved back to drafts.', archive: 'Archived.', delete: 'Deleted.' } as Record<string, string>)[what];
  if (!done) return { message: 'Unknown action.' };
  if (auth.ctx.mode === 'demo') return { ok: true, message: `${done} ${DEMO_NOTE}`, seq: Date.now() };
  if (!UUID.test(id)) return { message: 'This item could not be found.' };
  if (what === 'delete' && auth.ctx.role !== 'admin') return { message: 'Only admins can delete. Archive it instead.' };
  if (what === 'delete' && String(fd.get('confirm') ?? '') !== 'DELETE') return { message: 'Type DELETE to confirm.' };
  const db = auth.ctx.supabase.from('resources');
  const { data, error } = what === 'delete'
    ? await db.delete().eq('id', id).select('kind').maybeSingle()
    : await db.update({ publication: what === 'publish' ? 'published' : what === 'archive' ? 'archived' : 'draft' }).eq('id', id).select('kind').maybeSingle();
  if (error) return { message: 'Could not update: ' + error.message };
  if (!data) return { message: 'This item could not be found, or you do not have permission to change it.' };
  refresh(data.kind as ResourceKind);
  if (what === 'delete') redirect('/admin/resources?deleted=1');
  return { ok: true, message: done, seq: Date.now() };
}
