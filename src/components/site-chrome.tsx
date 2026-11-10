import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="group inline-flex min-h-11 items-center gap-2.5" aria-label="IFAFA Career Hub, home">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-forest font-serif text-lg font-bold text-white shadow-sm">C</span>
      <span className="leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">IFAFA</span>
        <span className="block font-serif text-lg font-semibold text-ink">Career Hub</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/about', label: 'How listings work' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-stone/90 backdrop-blur supports-[backdrop-filter]:bg-stone/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-white hover:text-forest sm:px-4">
              {n.href === '/about' ? <><span className="hidden sm:inline">{n.label}</span><span className="sm:hidden">About</span></> : n.label}
            </Link>
          ))}
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
            A volunteer-curated directory of returnships, career re-entry programmes and employment pathways in Ireland, for accompanying partners of Irish diplomatic staff.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-semibold text-ink">Please note</p>
          <p className="leading-relaxed">Listings are checked by IFAFA volunteers against official sources, but details can change. Always confirm eligibility, dates and terms on the employer’s own website before applying.</p>
          <p><Link href="/about" className="font-semibold text-forest hover:underline">How listings are verified</Link> · <Link href="/admin" className="hover:underline">Volunteer sign-in</Link></p>
        </div>
      </div>
    </footer>
  );
}
