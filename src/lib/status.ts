import type { ApplicationStatus, Opportunity } from './types';

/** Listings not re-checked within this many days are shown as "Status unverified". */
export const VERIFICATION_MAX_AGE_DAYS = 120;

/** Today's date in Ireland, as YYYY-MM-DD. Status changes at midnight Irish time, not UTC. */
export function todayInIreland(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
}

export interface StatusResult {
  status: ApplicationStatus;
  /** Plain-language reason, shown on the detail page so users understand the badge. */
  reason: string;
}

/**
 * The single source of truth for a listing's application status.
 * Rules, in order:
 *  1. Never verified, or last verified too long ago  -> unverified
 *  2. Dates verified by a volunteer                 -> derived from today vs opening/closing dates
 *  3. Otherwise, what the volunteer recorded when they checked (e.g. rolling applications)
 *  4. Nothing recorded                              -> unverified
 * Nothing is ever guessed.
 */
export function applicationStatus(o: Pick<Opportunity, 'last_verified_on' | 'dates_verified' | 'opens_on' | 'closes_on' | 'recorded_status'>, today = todayInIreland()): StatusResult {
  if (!o.last_verified_on) return { status: 'unverified', reason: 'This listing has not yet been checked against the official source.' };
  const age = daysBetween(o.last_verified_on, today);
  if (age > VERIFICATION_MAX_AGE_DAYS) return { status: 'unverified', reason: `Last checked more than ${Math.round(VERIFICATION_MAX_AGE_DAYS / 30)} months ago. Check the official source for the current status.` };

  if (o.dates_verified && (o.opens_on || o.closes_on)) {
    if (o.opens_on && today < o.opens_on) return { status: 'upcoming', reason: 'Applications open on the verified opening date.' };
    if (o.closes_on && today > o.closes_on) return { status: 'closed', reason: 'The verified closing date has passed.' };
    return { status: 'open', reason: o.closes_on ? 'Within the verified application window.' : 'Opened on the verified date; no closing date has been published.' };
  }
  if (o.recorded_status) {
    const reasons = { open: 'Reported as open when last checked; no closing date has been published.', upcoming: 'Reported as opening soon when last checked; no date has been confirmed.', closed: 'Reported as closed when last checked.' } as const;
    return { status: o.recorded_status, reason: reasons[o.recorded_status] };
  }
  return { status: 'unverified', reason: 'The application status could not be confirmed from the official source.' };
}

/** True when a volunteer should re-check this listing (never verified, or older than the limit). */
export function needsVerification(o: Pick<Opportunity, 'last_verified_on'>, today = todayInIreland()): boolean {
  return !o.last_verified_on || daysBetween(o.last_verified_on, today) > VERIFICATION_MAX_AGE_DAYS;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function daysFromToday(iso: string, today = todayInIreland()): number {
  return daysBetween(today, iso);
}
