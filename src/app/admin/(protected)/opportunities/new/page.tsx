import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { OpportunityForm } from '@/components/admin/opportunity-form';

export const dynamic = 'force-dynamic';
export default async function NewOpportunity() {
  await requireVolunteer();
  return (
    <div className="container-page max-w-3xl py-10">
      <Link href="/admin" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">← Listings</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold">Add a listing</h1>
      <p className="mt-2 text-ink-soft">New listings are saved as drafts. Nothing is visible to the public until it is published.</p>
      <div className="mt-8"><OpportunityForm /></div>
    </div>
  );
}
