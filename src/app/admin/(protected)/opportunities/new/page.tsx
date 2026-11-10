import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { getSuggestion } from '@/lib/admin-data';
import { OpportunityForm } from '@/components/admin/opportunity-form';
import type { Opportunity } from '@/lib/types';

export const dynamic = 'force-dynamic';
export default async function NewOpportunity({ searchParams }: PageProps<'/admin/opportunities/new'>) {
  const ctx = await requireVolunteer();
  const sid = (await searchParams).suggestion;
  const s = typeof sid === 'string' ? await getSuggestion(ctx, sid) : null;
  return (
    <div className="container-page max-w-3xl py-10">
      <Link href={s ? '/admin/inbox' : '/admin/listings'} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">← {s ? 'Inbox' : 'Listings'}</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold">{s ? 'Review a suggestion' : 'Add a listing'}</h1>
      <p className="mt-2 text-ink-soft">New listings are saved as drafts. Nothing is visible to the public until it is published.</p>
      {s && <p className="mt-2 text-sm text-ink-soft">Pre-filled from <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-forest underline">{s.url}</a>. Check each field against the page.</p>}
      <div className="mt-8">
        <OpportunityForm
          prefill={s ? ({ source_url: s.url, ...s.fields } as Partial<Opportunity>) : undefined}
          provenance={s ? { source_url: 'the watched page', ...s.provenance } : undefined}
          suggestionId={s?.id}
        />
      </div>
    </div>
  );
}
