import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { listResources } from '@/lib/admin-data';
import { RESOURCE_KINDS, type ResourceKind } from '@/lib/resources';
import { formatDate } from '@/lib/status';
import { PUBLICATION_STATES } from '@/lib/types';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminResources({ searchParams }: PageProps<'/admin/resources'>) {
  const ctx = await requireVolunteer();
  const items = await listResources(ctx);
  const deleted = (await searchParams).deleted;
  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Events, support &amp; resources</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">Items shown on the public Events, Career support and Practical resources pages. Add only what you have checked on the provider’s own page.</p>
        </div>
        <div className="flex flex-wrap gap-2">{(Object.keys(RESOURCE_KINDS) as ResourceKind[]).map(k => <Link key={k} href={`/admin/resources/new?kind=${k}`} className="btn-secondary min-h-10">+ {RESOURCE_KINDS[k].label}</Link>)}</div>
      </div>
      {deleted && <p role="status" className="mt-4 rounded-xl bg-open-bg px-4 py-3 text-sm text-open">Item deleted.</p>}
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState title="Nothing added yet">{ctx.mode === 'demo' ? 'In the demo nothing is saved, so this list stays empty. Open one of the “+” buttons to see the form and its checks.' : 'Add the first event, support service or guide with the buttons above.'}</EmptyState>
        ) : (
          (Object.keys(RESOURCE_KINDS) as ResourceKind[]).map(k => {
            const list = items.filter(r => r.kind === k);
            return list.length ? (
              <section key={k} className="mb-8">
                <h2 className="font-serif text-xl font-semibold">{RESOURCE_KINDS[k].plural} <span className="text-base font-normal text-muted">({list.length})</span></h2>
                <ul className="card mt-3 divide-y divide-line">
                  {list.map(r => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0"><Link href={`/admin/resources/${r.id}`} className="font-semibold text-forest hover:underline">{r.title}</Link><p className="text-sm text-muted">{r.provider} · {PUBLICATION_STATES[r.publication]} · {r.last_verified_on ? `checked ${formatDate(r.last_verified_on)}` : 'never checked'}</p></div>
                      <Link href={`/admin/resources/${r.id}`} className="btn-secondary min-h-10">Edit</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null;
          })
        )}
      </div>
    </div>
  );
}
