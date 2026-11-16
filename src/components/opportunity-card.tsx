import Link from 'next/link';
import type { Listed } from '@/lib/filters';
import { PROGRAMME_TYPES, REGIONS, WORK_ARRANGEMENTS } from '@/lib/types';
import { daysFromToday, formatDate } from '@/lib/status';
import { ExampleBadge, StatusBadge, Tag } from './ui';

/** The one date line a card shows — only ever from verified dates. */
export function keyDate(o: Listed): string | null {
  if (!o.dates_verified) return null;
  if (o.appStatus === 'open' && o.closes_on) {
    const d = daysFromToday(o.closes_on);
    return d === 0 ? 'Closes today' : d === 1 ? 'Closes tomorrow' : d <= 14 ? `Closes in ${d} days · ${formatDate(o.closes_on)}` : `Closes ${formatDate(o.closes_on)}`;
  }
  if (o.appStatus === 'upcoming' && o.opens_on) return `Opens ${formatDate(o.opens_on)}`;
  if (o.appStatus === 'closed' && o.closes_on) return `Closed ${formatDate(o.closes_on)}`;
  return null;
}

export function OpportunityCard({ o, headingLevel = 'h2' }: { o: Listed; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  const date = keyDate(o);
  return (
    <article className={`card group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-[0_12px_32px_-18px_rgba(15,77,60,0.45)] sm:p-6 ${o.appStatus === 'closed' ? 'opacity-80' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={o.appStatus} />
        {o.is_example && <ExampleBadge />}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">{o.employer}</p>
      <H className="mt-1 font-serif text-xl font-semibold leading-snug text-ink">
        <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:underline">
          {o.programme_name}
        </Link>
      </H>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{o.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-sage-deep">{PROGRAMME_TYPES[o.programme_type]}</span>
        <Tag>{REGIONS[o.region]}</Tag>
        <Tag>{WORK_ARRANGEMENTS[o.work_arrangement]}</Tag>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Pay</dt><dd className={o.compensation ? 'text-ink' : 'italic text-muted'}>{o.compensation ?? 'Not confirmed'}</dd>
        <dt className="text-muted">Length</dt><dd className={o.duration ? 'text-ink' : 'italic text-muted'}>{o.duration ?? 'Not confirmed'}</dd>
      </dl>
      <div className="mt-auto pt-4">
        {date ? <p className="text-sm font-semibold text-ink">{date}</p> : <p className="text-sm text-muted">{o.appStatus === 'unverified' ? 'Check the official source for dates' : 'No confirmed dates published'}</p>}
        <p className="mt-1 text-xs text-muted">{o.last_verified_on ? `Checked ${formatDate(o.last_verified_on)}` : 'Not yet checked'}</p>
      </div>
    </article>
  );
}
