import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/auth-forms';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { AuthShell } from '../auth-shell';

export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  if (!isSupabaseConfigured()) redirect('/admin/setup');
  const expired = (await searchParams).link === 'expired';
  return (
    <AuthShell title="Sign in" intro="For authorised volunteers who maintain the directory. Accounts are created by an IFAFA administrator.">
      {expired && <p role="alert" className="mb-4 rounded-xl bg-unverified-bg px-4 py-3 text-sm text-unverified">That email link has expired or was already used. Request a new password reset link below.</p>}
      <LoginForm />
    </AuthShell>
  );
}
