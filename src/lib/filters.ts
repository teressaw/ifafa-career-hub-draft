import { APPLICATION_STATUSES, CAREER_BREAK, PROGRAMME_TYPES, REGIONS, SECTORS, WORK_ARRANGEMENTS, type ApplicationStatus, type Opportunity } from './types';
import { applicationStatus, todayInIreland } from './status';

export const FILTERS = {
  sector: { label: 'Career sector', options: SECTORS },
  region: { label: 'Location', options: REGIONS },
  arrangement: { label: 'Working arrangement', options: WORK_ARRANGEMENTS },
  type: { label: 'Programme type', options: PROGRAMME_TYPES },
  careerBreak: { label: 'Career-break eligibility', options: CAREER_BREAK },
  status: { label: 'Application status', options: APPLICATION_STATUSES },
} as const;
export type FilterKey = keyof typeof FILTERS;

export const SORTS = { relevance: 'Most relevant', closing: 'Closing soonest', verified: 'Recently verified', az: 'A–Z by employer' } as const;
export type SortKey = keyof typeof SORTS;

export interface Query {
  q: string;
  sector: string;
  region: string;
  arrangement: string;
  type: string;
  careerBreak: string;
  status: string;
  sort: SortKey;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Parse and sanitise URL search params. Unknown values are ignored rather than trusted. */
export function parseQuery(raw: Raw): Query {
  const pick = (key: FilterKey) => { const v = one(raw[key]); return v in FILTERS[key].options ? v : ''; };
  const sort = one(raw.sort);
  return {
    q: one(raw.q).trim().slice(0, 100),
    sector: pick('sector'), region: pick('region'), arrangement: pick('arrangement'), type: pick('type'), careerBreak: pick('careerBreak'), status: pick('status'),
    sort: (sort in SORTS ? sort : 'relevance') as SortKey,
  };
}

export function activeFilterCount(q: Query): number {
  return (Object.keys(FILTERS) as FilterKey[]).filter(k => q[k]).length;
}

/** Build a URL for the directory with one value changed (used by filter chips and links). */
export function queryHref(q: Query, change: Partial<Query>): string {
  const next = { ...q, ...change };
  const p = new URLSearchParams();
  (['q', ...Object.keys(FILTERS), 'sort'] as (keyof Query)[]).forEach(k => { const v = next[k]; if (v && !(k === 'sort' && v === 'relevance')) p.set(k, String(v)); });
  const s = p.toString();
  return '/opportunities' + (s ? '?' + s : '');
}

export interface Listed extends Opportunity { appStatus: ApplicationStatus; statusReason: string }

const STATUS_ORDER: Record<ApplicationStatus, number> = { open: 0, upcoming: 1, unverified: 2, closed: 3 };

export function applyQuery(items: Opportunity[], q: Query, today = todayInIreland()): Listed[] {
  const terms = q.q.toLowerCase().split(/\s+/).filter(Boolean);
  const listed = items.map(o => { const s = applicationStatus(o, today); return { ...o, appStatus: s.status, statusReason: s.reason }; });
  const filtered = listed.filter(o =>
    (!q.sector || o.sector === q.sector) &&
    (!q.region || o.region === q.region) &&
    (!q.arrangement || o.work_arrangement === q.arrangement) &&
    (!q.type || o.programme_type === q.type) &&
    (!q.careerBreak || o.career_break === q.careerBreak) &&
    (!q.status || o.appStatus === q.status) &&
    (!terms.length || terms.every(t => [o.employer, o.programme_name, o.summary, o.description, o.location, o.eligibility ?? '', SECTORS[o.sector], PROGRAMME_TYPES[o.programme_type]].join(' ').toLowerCase().includes(t))));

  const byEmployer = (a: Listed, b: Listed) => a.employer.localeCompare(b.employer);
  const closing = (o: Listed) => (o.dates_verified && o.closes_on && o.appStatus === 'open' ? o.closes_on : '9999');
  const sorters: Record<SortKey, (a: Listed, b: Listed) => number> = {
    relevance: (a, b) => STATUS_ORDER[a.appStatus] - STATUS_ORDER[b.appStatus] || Number(a.is_example) - Number(b.is_example) || closing(a).localeCompare(closing(b)) || byEmployer(a, b),
    closing: (a, b) => closing(a).localeCompare(closing(b)) || STATUS_ORDER[a.appStatus] - STATUS_ORDER[b.appStatus] || byEmployer(a, b),
    verified: (a, b) => (b.last_verified_on ?? '').localeCompare(a.last_verified_on ?? '') || byEmployer(a, b),
    az: byEmployer,
  };
  return filtered.sort(sorters[q.sort]);
}
