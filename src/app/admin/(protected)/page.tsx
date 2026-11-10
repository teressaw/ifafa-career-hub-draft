import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { workload } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

function Tile({ href, value, label, detail, tone = 'plain' }: { href: string; value: number; label: string; detail: string; tone?: 'plain' | 'attention' }) {
  return (
    <Link href={href} className={`card block p-5 transition hover:border-forest/40 ${tone === 'attention' && value > 0 ? 'border-unverified/30 bg-unverified-bg/40' : ''}`}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-1 font-serif text-4xl font-semibold ${tone === 'attention' && value > 0 ? 'text-unverified' : 'text-ink'}`}>{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{detail}</p>
    </Link>
  );
}

export default async function Overview() {
  const ctx = await requireVolunteer();
  const w = await workload(ctx);
  const nothingToDo = w.minutes === 0;
  return (
    <div className="container-page py-10">
      <p className="eyebrow">This week</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Keeping the directory up to date</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">The hub watches official pages for you and flags only what needs a person. Volunteers review changes and suggestions — they don’t have to search the web.</p>

      <section aria-labelledby="effort" className="card mt-8 flex flex-col gap-4 bg-forest p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 id="effort" className="text-sm font-semibold uppercase tracking-wider text-white/75">Estimated volunteer time</h2>
          <p className="mt-1 font-serif text-4xl font-semibold">{nothingToDo ? 'Nothing due' : `About ${Math.max(5, Math.ceil(w.minutes / 5) * 5)} minutes`}</p>
          <p className="mt-1 text-sm text-white/80">{nothingToDo ? (ctx.mode === 'demo' ? 'Run a live check of the watched sources to see how changes are flagged.' : 'Everything is checked and current.') : 'Based on the items below: about 5 minutes per changed page, 4 per suggestion and 3 per routine re-check.'}</p>
        </div>
        <Link href={w.changed || ctx.mode === 'demo' ? '/admin/sources' : '/admin/listings'} className="btn shrink-0 bg-white text-forest hover:bg-mint">{ctx.mode === 'demo' ? 'Check the sources live →' : 'Start →'}</Link>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile href="/admin/sources" value={w.changed} label="Pages that changed" detail={`${w.sources} official pages watched${w.unchecked ? ` · ${w.unchecked} not checked yet` : ''}`} tone="attention" />
        <Tile href="/admin/inbox" value={w.suggestions} label="Suggestions to review" detail="Drafts pre-filled from structured job data" tone="attention" />
        <Tile href="/admin/listings?view=attention" value={w.due} label="Listings due a re-check" detail="Not verified in the last 4 months" tone="attention" />
        <Tile href="/admin/sources" value={w.problems} label="Pages we couldn’t check" detail="Blocked or unreachable — check by hand" tone="attention" />
      </div>

      <section aria-labelledby="how" className="mt-12 grid gap-6 lg:grid-cols-3">
        <h2 id="how" className="sr-only">How the work is shared</h2>
        {[
          ['1', 'The hub watches', 'Official programme and careers pages are checked automatically on a schedule. Sites that ask not to be read by automated tools are respected and flagged for a person instead.'],
          ['2', 'It flags and drafts', 'When a page changes, the hub shows what changed. Where a page publishes structured job details, it pre-fills a draft — every field shows exactly where it came from.'],
          ['3', 'A volunteer confirms', 'Nothing is published automatically. A volunteer checks the source, confirms dates and publishes. That keeps the directory accurate.'],
        ].map(([n, t, d]) => (
          <div key={n} className="card p-6">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-mint font-semibold text-forest">{n}</span>
            <h3 className="mt-3 font-serif text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 text-sm text-muted">{w.published} published · {w.listings} listings in total. <Link href="/admin/opportunities/new" className="font-semibold text-forest hover:underline">Add a listing by hand</Link> or <Link href="/admin/import" className="font-semibold text-forest hover:underline">import one from a link</Link>.</p>
    </div>
  );
}
