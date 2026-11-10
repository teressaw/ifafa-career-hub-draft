import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { AuthShell } from '../auth-shell';
export const dynamic = 'force-dynamic';
export default function SetupPage() {
  const ok = isSupabaseConfigured();
  return (
    <AuthShell title={ok ? 'Database connected' : 'Connect the database'}>
      {ok ? <Link href="/admin/login" className="btn-primary">Go to sign in</Link> : (
        <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>The volunteer area needs a Supabase database. Until it is connected, the public directory shows example listings.</p>
          <p>Set <code className="rounded bg-stone-2 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-stone-2 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, then restart the app. The README explains each step.</p>
          <Link href="/" className="btn-secondary mt-2">Back to the directory</Link>
        </div>
      )}
    </AuthShell>
  );
}
