import 'server-only';
import { isSupabaseConfigured } from './supabase/config';
import { createPublicClient } from './supabase/server';
import { RESOURCE_PUBLIC_COLUMNS, type Resource, type ResourceKind } from './resources';

/** Published items of one kind. Without a database there is no content (and no invented content). */
export async function listPublishedResources(kind: ResourceKind): Promise<Resource[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient().from('resources').select(RESOURCE_PUBLIC_COLUMNS).eq('kind', kind).eq('publication', 'published').order('title').limit(500);
  if (error) throw new Error('Could not load this page: ' + error.message);
  return (data ?? []) as unknown as Resource[];
}

/** Kind and audiences of every published item — enough for the homepage counts. */
export async function publishedResourceIndex(): Promise<Pick<Resource, 'kind' | 'audiences'>[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createPublicClient().from('resources').select('kind,audiences').eq('publication', 'published').limit(2000);
  if (error) return [];
  return (data ?? []) as Pick<Resource, 'kind' | 'audiences'>[];
}
