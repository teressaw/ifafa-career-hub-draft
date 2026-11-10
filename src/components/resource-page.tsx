import Link from 'next/link';
import { PATHS, type PathKey } from '@/lib/filters';
import { AUDIENCES, COSTS, FORMATS, RESOURCE_KINDS, forPath, type Resource, type ResourceKind } from '@/lib/resources';
import { listPublishedResources } from '@/lib/resources-data';
import { formatDate, todayInIreland } from '@/lib/status';
import { EmptyState, Tag } from '@/components/ui';

const INTRO: Record<ResourceKind, { eyebrow: string; title: string; lead: string; none: string }> = {
  event: { eyebrow: 'Events', title: 'Events', lead: 'Free webinars, career workshops and professional networking opportunities, checked against the organiser’s own page.', none: 'No events are listed yet. Volunteers add events only after confirming them with the organiser.' },
  support: { eyebrow: 'Career support', title: 'Career support', lead: 'Free or funded coaching, CV support and professional networks.', none: 'No career support services are listed yet. Volunteers add services only after checking the provider’s own page.' },
  resource: { eyebrow: 'Practical resources', title: 'Practical resources', lead: 'Guidance on career breaks, work eligibility and preparing to return to Ireland, from official sources.', none: 'No resources are listed yet. Volunteers add guides only from official or reputable sources.' },
};

function PathChips({ kind, path }: { kind: ResourceKind; path: PathKey | '' }) {
  const base = RESOURCE_KINDS[kind].href;
  const chip = (href: string, text: string, on: boolean) => (
    <li key={href}><Link href={href} aria-current={on ? 'page' : undefined} className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold ${on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink-soft hover:border-forest hover:text-forest'}`}>{text}</Link></li>
  );
  return (
    <nav aria-label="Filter by your situation"><ul className="flex flex-wrap gap-2">
      {chip(base, 'Everything', !path)}
      {(Object.keys(PATHS) as PathKey[]).map(p => chip(`${base}?path=${p}`, PATHS[p].label, path === p))}
    </ul></nav>
  );
}

function Item({ r }: { r: Resource }) {
  return (
    <li className="card flex flex-col p-5 sm:p-6">
      {r.kind === 'event' && (
        <p className="text-sm font-semibold text-forest">{r.date_verified && r.event_date ? <>{formatDate(r.event_date)}{r.event_time ? ` · ${r.event_time}` : ''}</> : <span className="text-unverified">Date to be confirmed — check the organiser’s page</span>}</p>
      )}
      <h2 className="mt-1 font-serif text-xl font-semibold leading-snug">{r.title}</h2>
      <p className="text-sm text-muted">{r.provider}</p>
      <p className="mt-3 text-ink-soft">{r.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Details">
        {r.cost !== 'not-stated' && <li><Tag>{COSTS[r.cost]}</Tag></li>}
        {r.format !== 'not-stated' && <li><Tag>{FORMATS[r.format]}{r.location ? ` · ${r.location}` : ''}</Tag></li>}
        {r.audiences.map(a => <li key={a}><Tag>{AUDIENCES[a]}</Tag></li>)}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <p className="text-xs text-muted">{r.last_verified_on ? `Checked ${formatDate(r.last_verified_on)}` : 'Not yet re-checked'}</p>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-10">Visit {r.kind === 'event' ? 'event page' : 'website'} <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span></a>
      </div>
    </li>
  );
}

export async function ResourcePage({ kind, rawPath }: { kind: ResourceKind; rawPath: string | string[] | undefined }) {
  const p = Array.isArray(rawPath) ? rawPath[0] : rawPath;
  const path = (p && p in PATHS ? p : '') as PathKey | '';
  const intro = INTRO[kind];
  const all = await listPublishedResources(kind);
  const items = all.filter(r => forPath(r, path));
  const today = todayInIreland();
  const past = kind === 'event' ? items.filter(r => r.date_verified && r.event_date && r.event_date < today) : [];
  const current = items.filter(r => !past.includes(r)).sort((a, b) => (a.event_date ?? '9999').localeCompare(b.event_date ?? '9999') || a.title.localeCompare(b.title));

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">{intro.eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{intro.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{intro.lead}</p>
      </header>
      <div className="mt-8"><PathChips kind={kind} path={path} /></div>
      <section aria-label={intro.title} className="mt-8">
        {current.length ? (
          <ul className="grid gap-5 md:grid-cols-2">{current.map(r => <Item key={r.id} r={r} />)}</ul>
        ) : all.length === 0 ? (
          <EmptyState title="Nothing listed yet" action={<Link href={path ? `/opportunities?path=${path}` : '/opportunities'} className="btn-primary">Browse opportunities</Link>}>{intro.none}</EmptyState>
        ) : (
          <EmptyState title={kind === 'event' ? 'No upcoming events for this situation' : 'Nothing for this situation yet'} action={<Link href={RESOURCE_KINDS[kind].href} className="btn-primary">Show everything</Link>}>Try “Everything” to see all {RESOURCE_KINDS[kind].plural.toLowerCase()}.</EmptyState>
        )}
      </section>
      {past.length > 0 && (
        <details className="mt-10">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-forest">Past events ({past.length})</summary>
          <ul className="mt-4 grid gap-5 opacity-80 md:grid-cols-2">{past.map(r => <Item key={r.id} r={r} />)}</ul>
        </details>
      )}
    </div>
  );
}
