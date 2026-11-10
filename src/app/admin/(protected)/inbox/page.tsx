import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { listSuggestions } from '@/lib/admin-data';
import { EmptyState } from '@/components/ui';
import { DismissButton } from '@/components/admin/dismiss-button';

export const dynamic = 'force-dynamic';
const LABELS: Record<string, string> = { programme_name: 'Programme', employer: 'Employer', location: 'Location', closes_on: 'Closing date (unconfirmed)', compensation: 'Pay' };

export default async function InboxPage() {
  const ctx = await requireVolunteer();
  const items = await listSuggestions(ctx);
  return (
    <div className="container-page py-10">
      <h1 className="font-serif text-3xl font-semibold">Inbox</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Draft listings the hub found in structured job data on watched pages. Accepting one opens a pre-filled form — you still check every field against the source before anything is published.</p>
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState title="Nothing to review" action={<div className="flex flex-wrap justify-center gap-2"><Link href="/admin/sources" className="btn-primary">Check watched sources</Link><Link href="/admin/import" className="btn-secondary">Import from a link</Link></div>}>
            {ctx.mode === 'demo'
              ? 'In the live system, job postings found on watched pages land here automatically. In the demo, run a check on the Watched sources page, or try “Import from a link”, to see a pre-filled draft.'
              : 'New suggestions appear here when a watched page publishes structured job details.'}
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {items.map(s => (
              <li key={s.id} className="card p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{s.source_name ?? 'Imported page'} · found {new Date(s.created_at).toLocaleDateString('en-IE')}</p>
                <h2 className="mt-1 font-serif text-xl font-semibold">{s.fields.programme_name ?? 'Untitled posting'}</h2>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {Object.entries(LABELS).filter(([k]) => s.fields[k as keyof typeof s.fields]).map(([k, l]) => (
                    <div key={k}><dt className="inline font-semibold text-muted">{l}: </dt><dd className="inline text-ink">{s.fields[k as keyof typeof s.fields]}</dd></div>
                  ))}
                </dl>
                <p className="mt-2 break-all text-sm"><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-forest underline">{s.url}</a></p>
                <div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/opportunities/new?suggestion=${s.id}`} className="btn-primary min-h-10">Review and create draft</Link><DismissButton id={s.id} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
