import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { signOut } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireVolunteer();
  return (
    <div>
      <div className="border-b border-line bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <nav aria-label="Volunteer area" className="flex flex-wrap items-center gap-1">
            <span className="mr-2 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gold">Volunteer area</span>
            <Link href="/admin" className="btn-ghost min-h-10 px-3">Listings</Link>
            <Link href="/admin/opportunities/new" className="btn-ghost min-h-10 px-3">Add listing</Link>
            <Link href="/admin/account" className="btn-ghost min-h-10 px-3">Account</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{user.email} · {role === 'admin' ? 'Admin' : 'Editor'}</span>
            <form action={signOut}><button className="btn-secondary min-h-10 px-4">Sign out</button></form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
