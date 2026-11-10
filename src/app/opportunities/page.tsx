import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery, activeFilterCount, queryHref, PATHS } from '@/lib/filters';
import { OpportunityCard } from '@/components/opportunity-card';
import { ActiveFilters, FilterForm } from '@/components/filters';
import { EmptyState, Notice } from '@/components/ui';

export const metadata: Metadata = { title: 'Opportunities' };
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
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Opportunities in Ireland</h1>
        <p className="mt-3 text-lg text-ink-soft">Returnships, re-entry programmes, training and roles for professionals returning after time abroad.</p>
      </header>
      {dataSource() === 'examples' && <div className="mt-6"><Notice tone="example" title="Showing example listings">All listings below are fictional examples. Real, verified opportunities will appear here once volunteers add them.</Notice></div>}

      {path && (
        <section aria-labelledby="path-h" className="mt-6 rounded-2xl border border-forest/25 bg-mint px-5 py-4">
          <p className="eyebrow">Your path</p>
          <h2 id="path-h" className="mt-1 font-serif text-xl font-semibold">{path.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{path.explains}</p>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
            <Link href={`/support?path=${q.path}`} className="text-forest underline underline-offset-4">Career support for this path</Link>
            <Link href={`/events?path=${q.path}`} className="text-forest underline underline-offset-4">Events</Link>
            <Link href={`/resources?path=${q.path}`} className="text-forest underline underline-offset-4">Practical resources</Link>
            <Link href={queryHref(q, { path: '' })} className="text-muted underline underline-offset-4">Show all opportunities</Link>
          </p>
        </section>
      )}

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
            <EmptyState title="No opportunities published yet">Volunteers are verifying the first listings. Please check back soon.</EmptyState>
          ) : q.path === 'abroad' && activeFilterCount(q) === 0 && !q.q ? (
            <EmptyState title="Nothing confirmed for working from abroad yet" action={<Link href="/opportunities?arrangement=remote" className="btn-primary">See remote listings</Link>}>
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
