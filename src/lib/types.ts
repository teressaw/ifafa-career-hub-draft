/**
 * Core types and the controlled vocabularies used for filtering.
 * The database enforces the same values with CHECK constraints (see supabase/migrations).
 */

export const SECTORS = {
  technology: 'Technology & digital',
  finance: 'Finance & accounting',
  legal: 'Legal & compliance',
  'public-sector': 'Public sector & policy',
  health: 'Health & life sciences',
  education: 'Education & research',
  communications: 'Marketing & communications',
  engineering: 'Engineering & built environment',
  nonprofit: 'Non-profit & international development',
  business: 'Business & operations',
  other: 'Other',
} as const;

export const REGIONS = {
  dublin: 'Dublin',
  cork: 'Cork',
  galway: 'Galway',
  limerick: 'Limerick',
  waterford: 'Waterford',
  'other-ireland': 'Elsewhere in Ireland',
  'anywhere-ireland': 'Anywhere in Ireland',
  multiple: 'Multiple locations',
} as const;

export const WORK_ARRANGEMENTS = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  'not-specified': 'Not specified',
} as const;

export const PROGRAMME_TYPES = {
  returnship: 'Returnship',
  reentry: 'Career re-entry programme',
  'flexible-role': 'Flexible or part-time role',
  training: 'Upskilling and training',
  mentoring: 'Mentoring programme',
  job: 'Employment opportunity',
} as const;

export const CAREER_BREAK = {
  'designed-for-returners': 'Designed for people returning after a career break',
  'breaks-welcome': 'Career breaks explicitly welcomed',
  'not-specified': 'Not specified by the employer',
} as const;

/** Whether the role can be done while living outside Ireland. "Remote" alone does not answer this. */
export const ABROAD = {
  yes: 'Can be done from outside Ireland',
  no: 'Must be based in Ireland',
  'not-stated': 'Not stated by the employer',
} as const;

export const APPLICATION_STATUSES = {
  open: 'Open now',
  upcoming: 'Opening soon',
  closed: 'Closed',
  unverified: 'Status unverified',
} as const;

/** What a volunteer recorded when they checked the source, for listings without verified dates (e.g. rolling intake). */
export const RECORDED_STATUSES = {
  open: 'Open (e.g. rolling applications)',
  upcoming: 'Expected to open (no confirmed date)',
  closed: 'Closed',
} as const;

export const PUBLICATION_STATES = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const;

export type Sector = keyof typeof SECTORS;
export type Region = keyof typeof REGIONS;
export type WorkArrangement = keyof typeof WORK_ARRANGEMENTS;
export type ProgrammeType = keyof typeof PROGRAMME_TYPES;
export type CareerBreak = keyof typeof CAREER_BREAK;
export type Abroad = keyof typeof ABROAD;
export type ApplicationStatus = keyof typeof APPLICATION_STATUSES;
export type RecordedStatus = keyof typeof RECORDED_STATUSES;
export type PublicationState = keyof typeof PUBLICATION_STATES;

export interface Opportunity {
  id: string;
  slug: string;
  employer: string;
  programme_name: string;
  summary: string;
  description: string;
  eligibility: string | null;
  duration: string | null;
  compensation: string | null;
  location: string;
  region: Region;
  work_arrangement: WorkArrangement;
  programme_type: ProgrammeType;
  career_break: CareerBreak;
  /** Confirmed with the source; defaults to not-stated. */
  abroad_eligibility: Abroad;
  sector: Sector;
  /** ISO dates (YYYY-MM-DD). Only shown publicly when dates_verified is true. */
  opens_on: string | null;
  closes_on: string | null;
  dates_verified: boolean;
  recorded_status: RecordedStatus | null;
  application_url: string | null;
  source_url: string;
  last_verified_on: string | null;
  publication: PublicationState;
  is_example: boolean;
  updated_at?: string;
}

/** Columns the public may read. Internal audit columns (created_by, verified_by…) are never exposed. */
export const PUBLIC_COLUMNS =
  'id,slug,employer,programme_name,summary,description,eligibility,duration,compensation,location,region,work_arrangement,programme_type,career_break,abroad_eligibility,sector,opens_on,closes_on,dates_verified,recorded_status,application_url,source_url,last_verified_on,publication,is_example,updated_at';

export const label = <T extends Record<string, string>>(map: T, key: string | null | undefined): string =>
  (key && (map as Record<string, string>)[key]) || 'Not specified';
