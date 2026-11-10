/**
 * Events, career support and practical resources. Curated by volunteers under the same rules as listings:
 * an official link, a last-verified date, and no event date unless it was confirmed at the source.
 * There is deliberately no sample content here — the pages say so honestly until volunteers add some.
 */
import type { PathKey } from './filters';

export const RESOURCE_KINDS = {
  event: { label: 'Event', plural: 'Events', href: '/events' },
  support: { label: 'Career support', plural: 'Career support', href: '/support' },
  resource: { label: 'Practical resource', plural: 'Practical resources', href: '/resources' },
} as const;
export type ResourceKind = keyof typeof RESOURCE_KINDS;

export const COSTS = { free: 'Free', funded: 'Funded or subsidised', paid: 'Paid', 'not-stated': 'Cost not stated' } as const;
export const FORMATS = { online: 'Online', 'in-person': 'In person', hybrid: 'Online and in person', 'not-stated': 'Format not stated' } as const;
export const AUDIENCES: Record<PathKey, string> = { abroad: 'Living overseas', return: 'Preparing to return', restart: 'Restarting a career' };

export interface Resource {
  id: string;
  kind: ResourceKind;
  title: string;
  provider: string;
  summary: string;
  details: string | null;
  url: string;
  audiences: PathKey[];
  cost: keyof typeof COSTS;
  format: keyof typeof FORMATS;
  location: string | null;
  event_date: string | null;
  event_time: string | null;
  date_verified: boolean;
  last_verified_on: string | null;
  publication: 'draft' | 'published' | 'archived';
  updated_at?: string;
}

export const RESOURCE_PUBLIC_COLUMNS = 'id,kind,title,provider,summary,details,url,audiences,cost,format,location,event_date,event_time,date_verified,last_verified_on,publication,updated_at';

/** Relevant to a pathway? Items with no audiences chosen apply to everyone. */
export const forPath = (r: Pick<Resource, 'audiences'>, path: PathKey | '') => !path || !r.audiences.length || r.audiences.includes(path);

/* ---------- Validation (shared by the server action; mirrors the database constraints) ---------- */
export type ResourceErrors = Partial<Record<string, string>>;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const isUrl = (s: string) => { try { const u = new URL(s); return (u.protocol === 'https:' || u.protocol === 'http:') && s.length <= 2000; } catch { return false; } };

export function validateResource(fd: FormData, today: string) {
  const e: ResourceErrors = {};
  const kind = str(fd, 'kind') as ResourceKind;
  const v = {
    kind, title: str(fd, 'title'), provider: str(fd, 'provider'), summary: str(fd, 'summary'), details: str(fd, 'details') || null,
    url: str(fd, 'url'), cost: str(fd, 'cost') || 'not-stated', format: str(fd, 'format') || 'not-stated', location: str(fd, 'location') || null,
    audiences: fd.getAll('audiences').map(String).filter(a => a in AUDIENCES) as PathKey[],
    date_verified: fd.get('date_verified') === 'on', event_date: str(fd, 'event_date') || null, event_time: str(fd, 'event_time') || null,
    verified_today: fd.get('verified_today') === 'on',
  };
  if (!(kind in RESOURCE_KINDS)) e.kind = 'Choose what kind of item this is.';
  if (v.title.length < 3 || v.title.length > 160) e.title = 'Enter a title (3–160 characters).';
  if (v.provider.length < 2 || v.provider.length > 120) e.provider = 'Enter who provides it (2–120 characters).';
  if (v.summary.length < 10 || v.summary.length > 400) e.summary = 'Write a short summary (10–400 characters).';
  if (v.details && v.details.length > 4000) e.details = 'Keep details under 4,000 characters.';
  if (!isUrl(v.url)) e.url = 'Enter the official web address, starting with https://';
  if (!(v.cost in COSTS)) e.cost = 'Choose a cost option.';
  if (!(v.format in FORMATS)) e.format = 'Choose a format.';
  if (v.location && v.location.length > 120) e.location = 'Keep the location under 120 characters.';
  if (v.event_time && v.event_time.length > 60) e.event_time = 'Keep the time under 60 characters.';
  if (kind !== 'event' || !v.date_verified) { v.event_date = null; v.event_time = null; v.date_verified = false; }
  else if (!v.event_date || !/^\d{4}-\d{2}-\d{2}$/.test(v.event_date)) e.event_date = 'Enter the date you confirmed, or untick “I confirmed the date”.';
  else if (v.event_date < addDays(today, -366) || v.event_date > addDays(today, 3 * 365)) e.event_date = 'That date looks wrong — check it against the source.';
  return Object.keys(e).length ? { errors: e } : { data: v };
}
function addDays(iso: string, n: number) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
