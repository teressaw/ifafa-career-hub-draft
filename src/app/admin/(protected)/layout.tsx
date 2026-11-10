import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { signOut } from '../actions';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/listings', label: 'Listings' },
  { href: '/admin/sources', label: 'Watched sources' },
  { href: '/admin/inbox', label: 'Inbox' },
  { href: '/admin/import', label: 'Import from a link' },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireVolunteer();
  return (
    <div>
      {ctx.mode === 'demo' && (
        <div role="note" className="border-b border-gold/30 bg-gold-soft">
          <p className="container-page py-2.5 text-sm text-ink"><strong>Demo of the volunteer area.</strong> Nothing you do here is saved. Checks of the watched websites are real and happen live.</p>
        </div>
      )}
      <div className="border-b border-line bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <nav aria-label="Volunteer area" className="-mx-1 flex gap-1 overflow-x-auto">
            {NAV.map(n => <Link key={n.href} href={n.href} className="btn-ghost min-h-10 shrink-0 px-3">{n.label}</Link>)}
            {ctx.mode === 'live' && <Link href="/admin/account" className="btn-ghost min-h-10 shrink-0 px-3">Account</Link>}
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden md:inline">{ctx.user.email} · {ctx.role === 'admin' ? 'Admin' : 'Editor'}</span>
            <form action={signOut}><button className="btn-secondary min-h-10 px-4">{ctx.mode === 'demo' ? 'Leave demo' : 'Sign out'}</button></form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
