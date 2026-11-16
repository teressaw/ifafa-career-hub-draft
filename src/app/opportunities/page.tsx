import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery, activeFilterCount, queryHref, PATHS } from '@/lib/filters';
import { OpportunityCard } from '@/components/opportunity-card';
import { ActiveFilters, FilterForm } from '@/components/filters';
import { EmptyState, Notice } from '@/components/ui';

export const metadata: Metadata = { title: 'Opportunities', description: 'Returnships, re-entry programmes and returner-friendly roles in Ireland, each checked against its official source.' };
export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage({ searchParams }: PageProps<'/opportunities'>) {
  const q = parseQuery(await searchParams);
  const all = await listPublished();
  const results = applyQuery(all, q);
  const filtered = activeFilterCount(q) > 0 || q.q || q.path;
  const path = q.path ? PATHS[q.path] : null;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Directory</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-olive">Opportunities in Ireland</h1>
        <p className="mt-3 text-lg text-ink-soft">Returnships, re-entry programmes and roles from employers who welcome people returning to paid work. Each listing is checked against its official source; where an employer hasn’t stated something, we say so.</p>
        <p className="mt-2 text-sm text-muted">Coverage is growing and not yet complete. <Link href="/about#listings" className="link">How listings are checked</Link> · <Link href="/returnships" className="link">What the labels mean</Link></p>
      </header>
      {dataSource() === 'examples' && <div className="mt-6"><Notice tone="example" title="Preview: showing example listings">All listings below are fictional. They appear only on preview and development copies of the site, never on the live one.</Notice></div>}

      {path && (
        <section aria-labelledby="path-h" className="mt-6 rounded-2xl border border-forest/25 bg-mint px-5 py-4">
          <p className="eyebrow">Showing</p>
          <h2 id="path-h" className="mt-1 font-serif text-xl font-semibold">{path.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{path.explains}</p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
            <Link href={`/support?path=${q.path}`} className="text-forest underline underline-offset-4">Career support</Link>
            <Link href={`/events?path=${q.path}`} className="text-forest underline underline-offset-4">Events</Link>
            <Link href={`/resources?path=${q.path}`} className="text-forest underline underline-offset-4">Practical resources</Link>
            <Link href={queryHref(q, { path: '' })} className="text-muted underline underline-offset-4">Show all opportunities</Link>
          </p>
        </section>
      )}

      <nav aria-label="Kinds of opportunity" className="mt-6 flex flex-wrap gap-2 text-sm">
        {([['', 'Everything'], ['return', PATHS.return.label], ['restart', PATHS.restart.label], ['abroad', PATHS.abroad.label]] as const).map(([k, l]) => (
          <Link key={k} href={queryHref(q, { path: k })} aria-current={q.path === k ? 'true' : undefined}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 font-semibold ${q.path === k ? 'border-olive bg-olive text-paper' : 'border-line bg-paper text-ink-soft hover:border-olive'}`}>{l}</Link>
        ))}
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside><div className="lg:sticky lg:top-24"><FilterForm q={q} /></div></aside>
        <section aria-labelledby="results-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="text-sm font-semibold text-muted" aria-live="polite">
              {results.length} {results.length === 1 ? 'opportunity' : 'opportunities'}{filtered ? ` matching your search` : ''}
            </h2>
          </div>
          <div className="mb-5"><ActiveFilters q={q} /></div>
          {results.length ? (
            <div className="grid gap-5 md:grid-cols-2">{results.map(o => <OpportunityCard key={o.id} o={o} />)}</div>
          ) : all.length === 0 ? (
            <EmptyState title="We’re checking our first listings" action={<Link href="/returnships" className="btn-primary">What to look for in a returnship</Link>}>Workbreak is new, and a listing appears only after a person has checked it against the employer’s own page. Nothing has passed that check yet, so there is nothing to show. We won’t fill the space with listings we can’t stand over.</EmptyState>
          ) : q.path === 'abroad' && activeFilterCount(q) === 0 && !q.q ? (
            <EmptyState title="Nothing confirmed as possible from outside Ireland yet" action={<Link href="/opportunities?arrangement=remote" className="btn-primary">See remote listings</Link>}>
              No listing has yet been confirmed as possible from outside Ireland. Remote listings may still be worth a look, but check each one’s location rules with the employer.
            </EmptyState>
          ) : (
            <EmptyState title="No opportunities match" action={<Link href="/opportunities" className="btn-primary">Clear search and filters</Link>}>
              Try removing a filter, or searching for a broader term such as a sector or city.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
