import 'server-only';
import { PUBLIC_COLUMNS, type Opportunity } from './types';
import { sampleOpportunities } from './sample-data';
import { isSupabaseConfigured } from './supabase/config';
import { createPublicClient } from './supabase/server';

export type DataSource = 'database' | 'examples';
export const dataSource = (): DataSource => (isSupabaseConfigured() ? 'database' : 'examples');

/** All published listings. The directory is small (tens to low hundreds), so filtering happens after one query. */
export async function listPublished(): Promise<Opportunity[]> {
  if (!isSupabaseConfigured()) return sampleOpportunities();
  const { data, error } = await createPublicClient().from('opportunities').select(PUBLIC_COLUMNS).eq('publication', 'published').limit(1000);
  if (error) throw new Error('Could not load opportunities: ' + error.message);
  return (data ?? []) as unknown as Opportunity[];
}

export async function getPublishedBySlug(slug: string): Promise<Opportunity | null> {
  if (!/^[a-z0-9-]{1,140}$/.test(slug)) return null;
  if (!isSupabaseConfigured()) return sampleOpportunities().find(o => o.slug === slug) ?? null;
  const { data, error } = await createPublicClient().from('opportunities').select(PUBLIC_COLUMNS).eq('slug', slug).eq('publication', 'published').maybeSingle();
  if (error) throw new Error('Could not load this opportunity: ' + error.message);
  return data as unknown as Opportunity | null;
}
