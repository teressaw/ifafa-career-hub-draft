import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireVolunteer } from '@/lib/auth';
import { applicationStatus, formatDate, needsVerification } from '@/lib/status';
import { PUBLICATION_STATES } from '@/lib/types';
import { getOpportunity } from '@/lib/admin-data';
import { OpportunityForm } from '@/components/admin/opportunity-form';
import { DeleteControl, PublicationControls, VerifyControl } from '@/components/admin/listing-actions';
import { ExampleBadge, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function EditOpportunity({ params, searchParams }: PageProps<'/admin/opportunities/[id]'>) {
  const { id } = await params;
  const ctx = await requireVolunteer();
  const o = await getOpportunity(ctx, id);
  if (!o) notFound();
  const role = ctx.role;
  const status = applicationStatus(o);
  const created = (await searchParams).created;

  return (
    <div className="container-page py-10">
      <Link href="/admin/listings" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">← Listings</Link>
      {created && <p role="status" className="mt-2 rounded-xl bg-open-bg px-4 py-3 text-sm text-open">Listing created as a draft.</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={status.status} />{o.is_example && <ExampleBadge />}</div>
      <h1 className="mt-3 font-serif text-3xl font-semibold">{o.programme_name}</h1>
      <p className="text-muted">{o.employer}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <OpportunityForm initial={o} />
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5">
            <h2 className="font-semibold">Visibility</h2>
            <p className="mt-1 text-sm text-muted">Currently: <strong className="text-ink">{PUBLICATION_STATES[o.publication]}</strong></p>
            {o.publication === 'published' && <Link href={`/opportunities/${o.slug}`} target="_blank" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-forest hover:underline">View public page ↗</Link>}
            <div className="mt-4"><PublicationControls id={o.id} publication={o.publication} /></div>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">Verification</h2>
            <p className={`mt-1 text-sm ${needsVerification(o) ? 'font-semibold text-unverified' : 'text-muted'}`}>{o.last_verified_on ? `Last verified ${formatDate(o.last_verified_on)}` : 'Never verified'}</p>
            <p className="mt-1 text-xs text-muted">Public status: {status.reason}</p>
            <a href={o.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center break-all text-sm font-semibold text-forest hover:underline">Open the source ↗</a>
            <div className="mt-3"><VerifyControl id={o.id} /></div>
          </section>
          {role === 'admin' && (
            <section className="card border-red-100 p-5">
              <h2 className="font-semibold">Delete</h2>
              <p className="mt-1 text-sm text-muted">Prefer archiving: it hides the listing but keeps its history.</p>
              <div className="mt-3"><DeleteControl id={o.id} /></div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
