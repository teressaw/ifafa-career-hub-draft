import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery, activeFilterCount } from '@/lib/filters';
import { OpportunityCard } from '@/components/opportunity-card';
import { ActiveFilters, FilterForm } from '@/components/filters';
import { EmptyState, Notice } from '@/components/ui';

export const metadata: Metadata = { title: 'Opportunities' };
export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage({ searchParams }: PageProps<'/opportunities'>) {
  const q = parseQuery(await searchParams);
  const all = await listPublished();
  const results = applyQuery(all, q);
  const filtered = activeFilterCount(q) > 0 || q.q;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Directory</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Opportunities in Ireland</h1>
        <p className="mt-3 text-lg text-ink-soft">Returnships, re-entry programmes, training and roles for professionals returning after time abroad.</p>
      </header>
      {dataSource() === 'examples' && <div className="mt-6"><Notice tone="example" title="Showing example listings">All listings below are fictional examples. Real, verified opportunities will appear here once volunteers add them.</Notice></div>}

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
