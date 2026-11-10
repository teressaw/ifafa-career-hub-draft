import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/supabase/config';
import { checkPage } from '@/lib/monitor/check';
import { recordCheck } from '@/lib/monitor/record';

/**
 * OPTIONAL scheduled check of watched sources (see vercel.json and the README).
 * Runs only when CRON_SECRET and SUPABASE_SECRET_KEY are both set on the server. The secret key
 * bypasses row-level security, so it is used here and nowhere else, and is never sent to a browser.
 * It only updates sources and adds suggestions — it never creates or publishes listings.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get('authorization') ?? '';
  const want = `Bearer ${secret}`;
  return !!secret && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function GET(req: Request) {
  if (!authorised(req)) return Response.json({ error: 'Not authorised' }, { status: 401 });
  const cfg = supabaseConfig(), key = process.env.SUPABASE_SECRET_KEY;
  if (!cfg || !key) return Response.json({ skipped: 'Scheduled checks are not configured.' });

  const db = createClient(cfg.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from('sources').select('id,url,content_hash,snapshot,check_every_days,last_checked_at').eq('active', true).order('last_checked_at', { ascending: true, nullsFirst: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const now = Date.now(), started = now, results: { id: string; status: string }[] = [];
  const due = (data ?? []).filter(s => !s.last_checked_at || now - Date.parse(s.last_checked_at) >= s.check_every_days * 86_400_000 - 3_600_000);
  for (const s of due) {
    if (Date.now() - started > 45_000) break; // leave the rest for tomorrow
    const r = await checkPage(s.url, { hash: s.content_hash, snapshot: s.snapshot });
    try { await recordCheck(db, s.id, r, null); results.push({ id: s.id, status: r.status }); }
    catch (e) { results.push({ id: s.id, status: 'save-failed: ' + (e as Error).message }); }
    await new Promise(res => setTimeout(res, 1000)); // one page at a time, politely
  }
  return Response.json({ checked: results.length, due: due.length, results });
}
