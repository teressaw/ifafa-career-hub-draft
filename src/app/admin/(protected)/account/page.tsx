import { redirect } from 'next/navigation';
import { requireVolunteer } from '@/lib/auth';
import { PasswordForm } from '@/components/admin/auth-forms';

export const dynamic = 'force-dynamic';
export default async function Account() {
  const ctx = await requireVolunteer();
  if (ctx.mode === 'demo') redirect('/admin');
  const { user, role } = ctx;
  return (
    <div className="container-page max-w-xl py-10">
      <h1 className="font-serif text-3xl font-semibold">Your account</h1>
      <p className="mt-2 text-ink-soft">Signed in as <strong>{user.email}</strong> · {role === 'admin' ? 'Admin' : 'Editor'}</p>
      <section className="card mt-8 p-6">
        <h2 className="font-serif text-xl font-semibold">Set a new password</h2>
        <p className="mt-1 text-sm text-muted">If you arrived from an invitation or reset email, choose your password here.</p>
        <div className="mt-5"><PasswordForm /></div>
      </section>
    </div>
  );
}
