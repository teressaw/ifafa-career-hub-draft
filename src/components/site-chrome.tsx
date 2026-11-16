import Link from 'next/link';
import { contactEmail, mailto } from '@/lib/contact';

/** The typeset wordmark. The hand-drawn lettering lives in the hero artwork; this is the everyday, accessible version. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`font-serif font-semibold tracking-[-0.03em] text-olive ${size === 'lg' ? 'text-[34px]' : 'text-[27px]'} leading-none`}>
      workbreak<span className="text-rust">.</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center rounded-md" aria-label="Workbreak, home">
      <Wordmark />
    </Link>
  );
}

export const NAV = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/employers', label: 'For employers' },
  { href: '/returnships', label: 'Returnships, explained' },
  { href: '/about', label: 'About' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
      <div className="container-page flex flex-col gap-1 py-2.5 md:flex-row md:items-center md:justify-between md:gap-6">
        <Logo />
        <nav aria-label="Main" className="-mx-2 flex flex-wrap items-center gap-x-0.5 text-[15px] font-semibold">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center rounded-lg px-2 text-ink-soft hover:text-olive lg:px-3">{n.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const email = contactEmail();
  return (
    <footer className="mt-24 border-t border-line bg-stone-2">
      <div className="container-page grid gap-10 py-12 text-sm text-muted md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-2 font-serif text-lg italic text-olive">Life isn’t a career break.</p>
          <p className="mt-4 max-w-sm leading-relaxed">
            An independent, Ireland-first project helping people return to paid work, and helping employers build better ways back.
            We’re at an early stage: coverage is growing and every listing is checked by a person before it appears.
          </p>
        </div>
        <nav aria-label="Footer: explore" className="space-y-1">
          <p className="mb-2 font-semibold text-ink">Explore</p>
          {[...NAV, { href: '/events', label: 'Events' }, { href: '/support', label: 'Career support' }, { href: '/resources', label: 'Practical resources' }].map(n => (
            <Link key={n.href} href={n.href} className="block min-h-8 py-1 hover:text-olive hover:underline">{n.label}</Link>
          ))}
        </nav>
        <div className="space-y-1">
          <p className="mb-2 font-semibold text-ink">About the listings</p>
          <p className="leading-relaxed">Details change. Always confirm eligibility, dates and pay with the employer before applying.</p>
          <Link href="/about#listings" className="block min-h-8 py-1 hover:text-olive hover:underline">How listings are checked</Link>
          <Link href="/privacy" className="block min-h-8 py-1 hover:text-olive hover:underline">Privacy</Link>
          {email && <a href={mailto(email, 'Workbreak')} className="block min-h-8 py-1 hover:text-olive hover:underline">Contact</a>}
          <Link href="/admin" className="block min-h-8 py-1 hover:text-olive hover:underline">Team sign-in</Link>
        </div>
      </div>
    </footer>
  );
}
