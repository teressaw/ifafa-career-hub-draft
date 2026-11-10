import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery } from '@/lib/filters';
import { PROGRAMME_TYPES, type ApplicationStatus } from '@/lib/types';
import { OpportunityCard } from '@/components/opportunity-card';
import { Notice, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

const STATUS_HELP: [ApplicationStatus, string][] = [
  ['open', 'Applications are open, based on dates or information a volunteer has checked at the official source.'],
  ['upcoming', 'Expected to open. Opening dates are shown only when confirmed.'],
  ['closed', 'The verified closing date has passed. Kept for reference — many programmes run again.'],
  ['unverified', 'Not checked recently, or the status could not be confirmed. Check the official source before relying on it.'],
];

export default async function Home() {
  const all = applyQuery(await listPublished(), parseQuery({}));
  const highlight = all.filter(o => o.appStatus === 'open' || o.appStatus === 'upcoming').slice(0, 3);
  const counts = { open: all.filter(o => o.appStatus === 'open').length, upcoming: all.filter(o => o.appStatus === 'upcoming').length };
  const examplesOnly = all.length > 0 && all.every(o => o.is_example);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white to-stone">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-96 rounded-full bg-mint blur-3xl" />
        <div className="container-page relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">For accompanying partners of Irish diplomatic staff</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Your career continues, wherever the posting takes you.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Find returnships, career re-entry programmes and employment pathways in Ireland — each one checked by IFAFA volunteers against the official source.
            </p>
            <form action="/opportunities" method="get" role="search" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <label htmlFor="home-q" className="sr-only">Search opportunities</label>
              <input id="home-q" name="q" type="search" placeholder="Try “finance”, “legal” or “Dublin”" className="field min-h-12 rounded-full px-5" maxLength={100} />
              <button className="btn-primary min-h-12 px-7">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {(['returnship', 'reentry', 'flexible-role', 'training'] as const).map(t => (
                <Link key={t} href={`/opportunities?type=${t}`} className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink-soft hover:border-forest hover:text-forest">{PROGRAMME_TYPES[t]}</Link>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 self-stretch lg:self-end">
            <Link href="/opportunities?status=open" className="card p-5 hover:border-forest/40">
              <dt className="text-sm font-semibold text-muted">Open now</dt>
              <dd className="mt-2 font-serif text-4xl font-semibold text-open">{counts.open}</dd>
            </Link>
            <Link href="/opportunities?status=upcoming" className="card p-5 hover:border-forest/40">
              <dt className="text-sm font-semibold text-muted">Opening soon</dt>
              <dd className="mt-2 font-serif text-4xl font-semibold text-upcoming">{counts.upcoming}</dd>
            </Link>
            <div className="card col-span-2 p-5">
              <dt className="text-sm font-semibold text-muted">In the directory</dt>
              <dd className="mt-1 text-ink-soft"><span className="font-serif text-2xl font-semibold text-ink">{all.length}</span> listings across returnships, re-entry programmes, training and roles.</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="container-page py-14">
        {(examplesOnly || dataSource() === 'examples') && (
          <div className="mb-10"><Notice tone="example" title="These are example listings">The directory currently shows fictional examples to demonstrate how it works. Real, verified opportunities will replace them.</Notice></div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Open and opening soon</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Opportunities to look at now</h2>
          </div>
          <Link href="/opportunities" className="btn-secondary">Browse all opportunities →</Link>
        </div>
        {highlight.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{highlight.map(o => <OpportunityCard key={o.id} o={o} headingLevel="h3" />)}</div>
        ) : (
          <p className="mt-8 text-muted">No programmes are confirmed as open right now. <Link href="/opportunities" className="font-semibold text-forest underline">Browse all listings</Link>, including those opening later.</p>
        )}

        <section aria-labelledby="statuses" className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Trustworthy by design</p>
            <h2 id="statuses" className="mt-2 font-serif text-3xl font-semibold">What each status means</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">Every listing links to its official source and shows when a volunteer last checked it. We never estimate application dates, eligibility or pay — if it isn’t confirmed, we say so.</p>
            <Link href="/about" className="btn-ghost mt-4 -ml-5">How listings are verified →</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {STATUS_HELP.map(([s, t]) => <li key={s} className="card p-5"><StatusBadge status={s} /><p className="mt-3 text-sm leading-relaxed text-ink-soft">{t}</p></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
