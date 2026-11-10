import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireVolunteer } from '@/lib/auth';
import { getResource } from '@/lib/admin-data';
import { RESOURCE_KINDS } from '@/lib/resources';
import { PUBLICATION_STATES } from '@/lib/types';
import { ResourceControls, ResourceForm } from '@/components/admin/resource-form';

export const dynamic = 'force-dynamic';
export default async function EditResource({ params, searchParams }: PageProps<'/admin/resources/[id]'>) {
  const ctx = await requireVolunteer();
  const r = await getResource(ctx, (await params).id);
  if (!r) notFound();
  const created = (await searchParams).created;
  return (
    <div className="container-page py-10">
      <Link href="/admin/resources" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">← Events, support &amp; resources</Link>
      {created && <p role="status" className="mt-2 rounded-xl bg-open-bg px-4 py-3 text-sm text-open">Saved as a draft.</p>}
      <h1 className="mt-2 font-serif text-3xl font-semibold">{r.title}</h1>
      <p className="text-muted">{RESOURCE_KINDS[r.kind].label} · {r.provider}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ResourceForm initial={r} />
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5">
            <h2 className="font-semibold">Visibility</h2>
            <p className="mt-1 text-sm text-muted">Currently: <strong className="text-ink">{PUBLICATION_STATES[r.publication]}</strong></p>
            {r.publication === 'published' && <Link href={RESOURCE_KINDS[r.kind].href} target="_blank" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-forest hover:underline">View public page ↗</Link>}
            <div className="mt-4"><ResourceControls r={r} isAdmin={ctx.role === 'admin'} /></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
