import Link from 'next/link';
import { requireVolunteer } from '@/lib/auth';
import { applicationStatus, formatDate, needsVerification } from '@/lib/status';
import { PUBLICATION_STATES, type Opportunity, type PublicationState } from '@/lib/types';
import { EmptyState, ExampleBadge, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

const VIEWS = { attention: 'Needs checking', draft: 'Drafts', published: 'Published', archived: 'Archived', all: 'All' } as const;
type View = keyof typeof VIEWS;

const PUB_STYLE: Record<PublicationState, string> = { draft: 'bg-stone-2 text-ink-soft', published: 'bg-mint text-forest', archived: 'bg-closed-bg text-closed' };

export default async function AdminHome({ searchParams }: PageProps<'/admin'>) {
  const sp = await searchParams;
  const view: View = (typeof sp.view === 'string' && sp.view in VIEWS ? sp.view : 'attention') as View;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase().slice(0, 100) : '';
  const { supabase } = await requireVolunteer();
  const { data, error } = await supabase.from('opportunities')
    .select('id,slug,employer,programme_name,publication,last_verified_on,dates_verified,opens_on,closes_on,recorded_status,is_example,updated_at')
    .order('updated_at', { ascending: false }).limit(1000);
  if (error) throw new Error('Could not load listings: ' + error.message);
  const all = (data ?? []) as Opportunity[];
  const attention = (o: Opportunity) => o.publication !== 'archived' && needsVerification(o);
  const counts: Record<View, number> = {
    attention: all.filter(attention).length, draft: all.filter(o => o.publication === 'draft').length,
    published: all.filter(o => o.publication === 'published').length, archived: all.filter(o => o.publication === 'archived').length, all: all.length,
  };
  const rows = all.filter(o => (view === 'all' || (view === 'attention' ? attention(o) : o.publication === view)) && (!q || `${o.employer} ${o.programme_name}`.toLowerCase().includes(q)));

  return (
    <div className="container-page py-10">
      {sp.deleted && <p role="status" className="mb-6 rounded-xl bg-open-bg px-4 py-3 text-sm text-open">The listing was deleted.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-3xl font-semibold">Listings</h1><p className="mt-1 text-ink-soft">Add, check and publish opportunities. Listings not checked for 4 months appear under “Needs checking”.</p></div>
        <Link href="/admin/opportunities/new" className="btn-primary">+ Add a listing</Link>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter listings" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {(Object.keys(VIEWS) as View[]).map(v => (
            <Link key={v} href={`/admin?view=${v}`} aria-current={v === view ? 'page' : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${v === view ? 'bg-forest text-white' : 'bg-white text-ink-soft ring-1 ring-line hover:text-forest'}`}>
              {VIEWS[v]} <span className={`rounded-full px-1.5 text-xs ${v === view ? 'bg-white/20' : 'bg-stone-2'}`}>{counts[v]}</span>
            </Link>
          ))}
        </nav>
        <form method="get" className="flex gap-2" role="search">
          <input type="hidden" name="view" value={view} />
          <label htmlFor="admin-q" className="sr-only">Search listings</label>
          <input id="admin-q" name="q" defaultValue={q} placeholder="Search employer or programme" className="field min-h-10 rounded-full md:w-72" />
          <button className="btn-secondary min-h-10">Search</button>
        </form>
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState title={view === 'attention' ? 'Everything is up to date' : 'No listings here'} action={<Link href="/admin/opportunities/new" className="btn-primary">Add a listing</Link>}>
            {view === 'attention' ? 'No published or draft listings need re-checking right now.' : 'Try another tab, or add a new listing.'}
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line">
            {rows.map(o => {
              const s = applicationStatus(o).status, stale = needsVerification(o);
              return (
                <li key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PUB_STYLE[o.publication]}`}>{PUBLICATION_STATES[o.publication]}</span>
                      <StatusBadge status={s} />{o.is_example && <ExampleBadge />}
                    </div>
                    <Link href={`/admin/opportunities/${o.id}`} className="mt-2 block font-semibold text-ink hover:text-forest hover:underline">{o.programme_name}</Link>
                    <p className="text-sm text-muted">{o.employer}</p>
                  </div>
                  <div className="text-sm sm:w-48 sm:text-right">
                    <p className={stale ? 'font-semibold text-unverified' : 'text-ink-soft'}>{o.last_verified_on ? `Checked ${formatDate(o.last_verified_on)}` : 'Never checked'}</p>
                    {stale && <p className="text-xs text-unverified">Needs checking</p>}
                  </div>
                  <Link href={`/admin/opportunities/${o.id}`} className="btn-secondary min-h-10 shrink-0">Edit</Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
