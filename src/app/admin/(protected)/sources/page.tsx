import { requireVolunteer } from '@/lib/auth';
import { listSources } from '@/lib/admin-data';
import { AddSourceForm, SourcesBoard } from '@/components/admin/sources-board';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function SourcesPage() {
  const ctx = await requireVolunteer();
  const sources = await listSources(ctx);
  return (
    <div className="container-page py-10">
      <h1 className="font-serif text-3xl font-semibold">Watched sources</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Official pages the hub keeps an eye on. When one changes, it is flagged here with a summary of what changed, so a volunteer only opens the pages that need attention.</p>
      <details className="mt-4 max-w-2xl text-sm text-muted">
        <summary className="inline-flex min-h-10 cursor-pointer items-center font-semibold text-forest">How the hub checks pages politely</summary>
        <p className="mt-1 leading-relaxed">It identifies itself as “IFAFA-CareerHub”, reads each site’s robots.txt rules and skips pages the site asks automated tools not to read, checks one page at a time, and stores only the text it needs to spot changes. It never logs in or fills in forms.</p>
      </details>
      <div className="mt-8"><SourcesBoard sources={sources} live={ctx.mode === 'live'} /></div>
      <div className="mt-10 max-w-3xl"><AddSourceForm /></div>
    </div>
  );
}
