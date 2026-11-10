import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CheckResult } from './check';

/** Save the result of a source check, and queue any structured job postings as suggestions. Used by "Check now" and the scheduled job. */
export async function recordCheck(supabase: SupabaseClient, sourceId: string, r: CheckResult, userId: string | null) {
  const update: Record<string, unknown> = { last_checked_at: r.checkedAt, last_error: r.status === 'error' || r.status === 'blocked' ? r.message : null };
  if (r.status === 'changed') Object.assign(update, { last_status: 'changed', last_changed_at: r.checkedAt, content_hash: r.hash, snapshot: r.snapshot, last_change: r.change });
  else if (r.status === 'unchanged') {
    Object.assign(update, { content_hash: r.hash, snapshot: r.snapshot, ...(r.change ? { last_change: r.change } : {}) });
    // An unchanged page keeps an earlier "changed" flag until a volunteer marks it reviewed.
    const { data } = await supabase.from('sources').select('last_status').eq('id', sourceId).maybeSingle();
    if (data?.last_status !== 'changed') update.last_status = 'unchanged';
  } else update.last_status = r.status;
  const { error } = await supabase.from('sources').update(update).eq('id', sourceId);
  if (error) throw new Error('Could not save the check: ' + error.message);
  for (const s of r.suggestions) {
    const key = `${s.fields.application_url ?? s.fields.source_url}|${s.fields.programme_name ?? ''}`.slice(0, 500);
    await supabase.from('suggestions').upsert(
      { source_id: sourceId, url: s.fields.source_url ?? '', dedupe_key: key, kind: s.kind, fields: s.fields, provenance: s.provenance, created_by: userId },
      { onConflict: 'dedupe_key', ignoreDuplicates: true });
  }
}
