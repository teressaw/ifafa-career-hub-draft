import 'server-only';
import type { VolunteerCtx } from './auth';
import type { Opportunity } from './types';
import { sampleOpportunities } from './sample-data';
import { DEMO_SOURCES, type Source } from './monitor/sources';
import type { DraftSuggestion } from './monitor/extract';
import { needsVerification } from './status';

export interface Suggestion {
  id: string;
  source_id: string | null;
  source_name?: string | null;
  url: string;
  kind: DraftSuggestion['kind'];
  fields: DraftSuggestion['fields'];
  provenance: DraftSuggestion['provenance'];
  status: 'new' | 'accepted' | 'dismissed';
  created_at: string;
}

const ADMIN_COLS = 'id,slug,employer,programme_name,summary,description,eligibility,duration,compensation,location,region,work_arrangement,programme_type,career_break,sector,opens_on,closes_on,dates_verified,recorded_status,application_url,source_url,last_verified_on,publication,is_example,updated_at';

export async function listOpportunities(ctx: VolunteerCtx): Promise<Opportunity[]> {
  if (ctx.mode === 'demo') return sampleOpportunities();
  const { data, error } = await ctx.supabase.from('opportunities').select(ADMIN_COLS).order('updated_at', { ascending: false }).limit(1000);
  if (error) throw new Error('Could not load listings: ' + error.message);
  return (data ?? []) as Opportunity[];
}

export async function getOpportunity(ctx: VolunteerCtx, id: string): Promise<Opportunity | null> {
  if (ctx.mode === 'demo') return sampleOpportunities().find(o => o.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await ctx.supabase.from('opportunities').select(ADMIN_COLS).eq('id', id).maybeSingle();
  if (error) throw new Error('Could not load this listing: ' + error.message);
  return data as Opportunity | null;
}

const SOURCE_COLS = 'id,name,url,kind,notes,check_every_days,last_checked_at,last_changed_at,last_status,last_error,content_hash,last_change,active';
export async function listSources(ctx: VolunteerCtx): Promise<Source[]> {
  if (ctx.mode === 'demo') return DEMO_SOURCES;
  const { data, error } = await ctx.supabase.from('sources').select(SOURCE_COLS).order('name');
  if (error) throw new Error('Could not load sources: ' + error.message);
  return (data ?? []).map(s => ({ ...s, snapshot: null })) as Source[];
}

export async function listSuggestions(ctx: VolunteerCtx, status: Suggestion['status'] = 'new'): Promise<Suggestion[]> {
  if (ctx.mode === 'demo') return [];
  const { data, error } = await ctx.supabase.from('suggestions').select('id,source_id,url,kind,fields,provenance,status,created_at,sources(name)').eq('status', status).order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('Could not load suggestions: ' + error.message);
  return (data ?? []).map((s: Record<string, unknown>) => ({ ...(s as unknown as Suggestion), source_name: (s.sources as { name?: string } | null)?.name ?? null }));
}

export async function getSuggestion(ctx: VolunteerCtx, id: string): Promise<Suggestion | null> {
  if (ctx.mode === 'demo' || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await ctx.supabase.from('suggestions').select('id,source_id,url,kind,fields,provenance,status,created_at').eq('id', id).maybeSingle();
  return data as Suggestion | null;
}

/** The "how much work is this?" numbers shown on the dashboard. */
export async function workload(ctx: VolunteerCtx) {
  const [opps, sources, suggestions] = await Promise.all([listOpportunities(ctx), listSources(ctx), listSuggestions(ctx)]);
  const due = opps.filter(o => o.publication !== 'archived' && needsVerification(o)).length;
  const changed = sources.filter(s => s.active && s.last_status === 'changed').length;
  const problems = sources.filter(s => s.active && (s.last_status === 'error' || s.last_status === 'blocked')).length;
  const unchecked = sources.filter(s => s.active && s.last_status === 'not-checked').length;
  // Rough, conservative minutes per task, based on opening the source and comparing.
  const minutes = changed * 5 + suggestions.length * 4 + due * 3 + problems * 2;
  return { listings: opps.length, published: opps.filter(o => o.publication === 'published').length, due, sources: sources.filter(s => s.active).length, changed, problems, unchecked, suggestions: suggestions.length, minutes };
}
