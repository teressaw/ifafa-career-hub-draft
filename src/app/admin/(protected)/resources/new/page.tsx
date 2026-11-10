import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { RESOURCE_KINDS, type ResourceKind } from '@/lib/resources';
import { ResourceForm } from '@/components/admin/resource-form';

export const dynamic = 'force-dynamic';
export default async function NewResource({ searchParams }: PageProps<'/admin/resources/new'>) {
  await requireVolunteer();
  const k = (await searchParams).kind;
  const kind = (typeof k === 'string' && k in RESOURCE_KINDS ? k : 'support') as ResourceKind;
  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/admin/resources" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">← Events, support &amp; resources</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Add {RESOURCE_KINDS[kind].label.toLowerCase()}</h1>
      <p className="mt-2 text-ink-soft">Saved as a draft. Nothing is public until it is published.</p>
      <div className="mt-8"><ResourceForm kind={kind} /></div>
    </div>
  );
}
