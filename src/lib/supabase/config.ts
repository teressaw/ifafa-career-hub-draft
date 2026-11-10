/** Supabase is optional during the first stage: without it, the directory shows the example listings. */
export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase now calls this the "publishable" key; older projects call it the "anon" key. Either works.
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export const isSupabaseConfigured = () => supabaseConfig() !== null;
