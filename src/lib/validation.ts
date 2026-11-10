import { ABROAD, CAREER_BREAK, PROGRAMME_TYPES, RECORDED_STATUSES, REGIONS, SECTORS, WORK_ARRANGEMENTS } from './types';
import { todayInIreland } from './status';

export type FieldErrors = Partial<Record<string, string>>;

export interface OpportunityInput {
  employer: string; programme_name: string; summary: string; description: string;
  eligibility: string | null; duration: string | null; compensation: string | null;
  location: string; region: string; work_arrangement: string; programme_type: string; career_break: string; abroad_eligibility: string; sector: string;
  opens_on: string | null; closes_on: string | null; dates_verified: boolean; recorded_status: string | null;
  application_url: string | null; source_url: string; is_example: boolean;
  verified_today: boolean;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').replace(/\r\n/g, '\n').trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';

function isHttpUrl(v: string) {
  try { const u = new URL(v); return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname.includes('.'); } catch { return false; }
}
function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().startsWith(v);
}

/** Server-side validation. The database enforces the same rules again with CHECK constraints. */
export function validateOpportunity(fd: FormData): { data: OpportunityInput | null; errors: FieldErrors } {
  const e: FieldErrors = {};
  const d: OpportunityInput = {
    employer: str(fd, 'employer'), programme_name: str(fd, 'programme_name'), summary: str(fd, 'summary'), description: str(fd, 'description'),
    eligibility: opt(fd, 'eligibility'), duration: opt(fd, 'duration'), compensation: opt(fd, 'compensation'),
    location: str(fd, 'location'), region: str(fd, 'region'), work_arrangement: str(fd, 'work_arrangement'),
    programme_type: str(fd, 'programme_type'), career_break: str(fd, 'career_break'), abroad_eligibility: str(fd, 'abroad_eligibility') || 'not-stated', sector: str(fd, 'sector'),
    opens_on: opt(fd, 'opens_on'), closes_on: opt(fd, 'closes_on'), dates_verified: bool(fd, 'dates_verified'), recorded_status: opt(fd, 'recorded_status'),
    application_url: opt(fd, 'application_url'), source_url: str(fd, 'source_url'), is_example: bool(fd, 'is_example'), verified_today: bool(fd, 'verified_today'),
  };
  const len = (k: keyof OpportunityInput, label: string, min: number, max: number, required = true) => {
    const v = d[k] as string | null;
    if (!v) { if (required) e[k] = `${label} is required.`; return; }
    if (v.length < min) e[k] = `${label} must be at least ${min} characters.`;
    else if (v.length > max) e[k] = `${label} must be ${max} characters or fewer.`;
  };
  len('employer', 'Employer', 2, 120); len('programme_name', 'Programme name', 2, 160);
  len('summary', 'Summary', 10, 300); len('description', 'Description', 20, 6000);
  len('eligibility', 'Eligibility', 0, 3000, false); len('duration', 'Duration', 0, 200, false); len('compensation', 'Compensation', 0, 300, false);
  len('location', 'Location', 2, 120);
  const inSet = (k: keyof OpportunityInput, set: object, label: string) => { if (!((d[k] as string) in set)) e[k] = `Choose a ${label}.`; };
  inSet('region', REGIONS, 'region'); inSet('work_arrangement', WORK_ARRANGEMENTS, 'working arrangement'); inSet('programme_type', PROGRAMME_TYPES, 'programme type');
  inSet('career_break', CAREER_BREAK, 'career-break option'); inSet('abroad_eligibility', ABROAD, 'option for working from outside Ireland'); inSet('sector', SECTORS, 'sector');
  if (d.recorded_status && !(d.recorded_status in RECORDED_STATUSES)) e.recorded_status = 'Choose a valid status.';

  if (!d.source_url) e.source_url = 'Add the official page where you found this opportunity.';
  else if (!isHttpUrl(d.source_url)) e.source_url = 'Enter a full web address starting with https://';
  if (d.application_url && !isHttpUrl(d.application_url)) e.application_url = 'Enter a full web address starting with https://';

  // Dates: only stored when a volunteer confirms them at the source. We never keep unconfirmed dates.
  for (const k of ['opens_on', 'closes_on'] as const) if (d[k] && !isIsoDate(d[k]!)) e[k] = 'Enter a valid date.';
  if (d.dates_verified) {
    if (!d.opens_on && !d.closes_on) e.dates_verified = 'Add at least one date you confirmed, or untick this box.';
    if (d.opens_on && d.closes_on && d.closes_on < d.opens_on) e.closes_on = 'The closing date must be on or after the opening date.';
  } else if (d.opens_on || d.closes_on) {
    e.dates_verified = 'Tick “I confirmed these dates at the official source”, or clear the dates. Unconfirmed dates are never published.';
  }
  if (d.dates_verified && d.recorded_status) d.recorded_status = null; // verified dates decide the status

  if (d.verified_today && !d.source_url) e.verified_today = 'You can only confirm verification against a source URL.';
  // Sanity: dates far in the past/future are usually typos.
  const today = todayInIreland();
  for (const k of ['opens_on', 'closes_on'] as const) if (d[k] && isIsoDate(d[k]!) && Math.abs(Date.parse(d[k]!) - Date.parse(today)) > 3 * 365 * 864e5) e[k] = 'This date is more than three years away — please check it.';

  return { data: Object.keys(e).length ? null : d, errors: e };
}

export function slugify(employer: string, programme: string): string {
  return `${employer} ${programme}`.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120).replace(/-+$/, '') || 'opportunity';
}
