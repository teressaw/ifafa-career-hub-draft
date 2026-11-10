import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient as createBareClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

/**
 * A client that acts as the signed-in user (admin pages and server actions).
 * Row-level security in the database decides what this user may read and change.
 */
export async function createUserClient() {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('Supabase is not configured.');
  const cookieStore = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Called from a Server Component: the proxy refreshes the session instead. */ }
      },
    },
  });
}

/** An anonymous client for public pages. It can only read published listings (enforced by RLS). */
export function createPublicClient() {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('Supabase is not configured.');
  return createBareClient(cfg.url, cfg.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
