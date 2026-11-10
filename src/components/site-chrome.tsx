import Link from 'next/link';
import { contactEmail, mailto } from '@/lib/contact';

export function Logo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-3" aria-label="IFAFA Career Hub, home">
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-forest text-[23px] text-white">✦</span>
      <span className="text-[19px] font-extrabold leading-[1.1] text-ink">IFAFA<br />Career Hub</span>
    </Link>
  );
}

export const NAV = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/events', label: 'Events' },
  { href: '/support', label: 'Career support' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'How it works' },
];

export function SiteHeader() {
  const email = contactEmail();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="container-page flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <Logo />
        <nav aria-label="Main" className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-0 text-sm font-semibold">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center rounded-lg px-2 text-ink hover:text-forest lg:px-3">{n.label}</Link>
          ))}
          {email && <a href={mailto(email, 'IFAFA Career Hub updates')} className="btn-primary ml-1 min-h-10 px-4">Get updates</a>}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-8 py-12 text-sm text-muted md:grid-cols-[1.4fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-md leading-relaxed">
            Opportunities and practical support for accompanying partners of Irish diplomatic staff — whether working during a posting, preparing to return to Ireland or restarting a career.
          </p>
          <nav aria-label="Footer" className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {NAV.map(n => <Link key={n.href} href={n.href} className="inline-flex min-h-9 items-center hover:text-forest hover:underline">{n.label}</Link>)}
          </nav>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-ink">Please note</p>
          <p className="leading-relaxed">Everything here is checked by IFAFA volunteers against official sources, but details can change. Always confirm eligibility, dates and terms with the employer or provider before applying.</p>
          <p><Link href="/about" className="font-semibold text-forest hover:underline">How listings are verified</Link> · <Link href="/admin" className="hover:underline">Volunteer sign-in</Link></p>
        </div>
      </div>
    </footer>
  );
}
