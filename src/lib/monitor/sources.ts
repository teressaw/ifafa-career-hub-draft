/**
 * Watched sources: official pages volunteers keep an eye on.
 * The demo list below is real Irish programmes and directories (pages checked to exist in November 2026).
 * Descriptions say only what each page is for — the page itself is always the authority.
 */
export const SOURCE_KINDS = {
  'programme-page': 'Programme page',
  'careers-page': 'Employer careers page',
  directory: 'Directory of programmes',
  'job-board': 'Job board',
} as const;
export type SourceKind = keyof typeof SOURCE_KINDS;

export type SourceStatus = 'not-checked' | 'unchanged' | 'changed' | 'error' | 'blocked';
export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  'not-checked': 'Not checked yet', unchanged: 'No change', changed: 'Changed — review', error: 'Couldn’t check', blocked: 'Site asks not to be checked automatically',
};

export interface Source {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  notes: string | null;
  check_every_days: number;
  last_checked_at: string | null;
  last_changed_at: string | null;
  last_status: SourceStatus;
  last_error: string | null;
  content_hash: string | null;
  snapshot: string | null;
  last_change: { added: string[]; removed: string[]; dateHints: string[] } | null;
  active: boolean;
}

const base = { notes: null, check_every_days: 7, last_checked_at: null, last_changed_at: null, last_status: 'not-checked' as const, last_error: null, content_hash: null, snapshot: null, last_change: null, active: true };

export const DEMO_SOURCES: Source[] = [
  { ...base, id: 'src-arc', name: 'Civil Service — Assisted Return to Career (ARC) Programme', url: 'https://www.gov.ie/en/department-of-justice-home-affairs-and-migration/organisation-information/assisted-return-to-career-programme', kind: 'programme-page', notes: 'Six-month paid returnship in the Civil Service.' },
  { ...base, id: 'src-deloitte', name: 'Deloitte Ireland — Return to Work Programme', url: 'https://www.deloitte.com/ie/en/careers/deloitte-life/benefits/Return-to-Work-Programme.html', kind: 'programme-page', notes: 'Annual programme; roles are advertised on Deloitte’s careers site when open.' },
  { ...base, id: 'src-pm', name: 'PM Group — Returners Programme', url: 'https://www.pmgroup-global.com/careers/returners-programme', kind: 'programme-page', notes: 'Engineering, technical and project management returners. Accepts enquiries year-round.' },
  { ...base, id: 'src-reboot', name: 'Technology Ireland Digital Skillnet — Women ReBOOT', url: 'https://www.digitalskillnet.ie/women-reboot/', kind: 'programme-page', notes: 'Training and work placement for women returning to tech roles.' },
  { ...base, id: 'src-ucc', name: 'University College Cork — Rejuvenate', url: 'https://ucc.ie/en/fitu/courses/shortcourse-rejuvenate', kind: 'programme-page', notes: 'Course for women planning a return to work.' },
  { ...base, id: 'src-b4b', name: 'Back for Business (returning emigrants)', url: 'https://www.backforbusiness.com', kind: 'programme-page', notes: 'Free programme for returning emigrants starting a business; funded through the Department of Foreign Affairs.' },
  { ...base, id: 'src-wr', name: 'Women Returners — returner opportunities in Ireland', url: 'https://womenreturners.com/returners/returner-opportunities-ireland/', kind: 'directory', notes: 'Lists returner programmes across employers in Ireland.' },
  { ...base, id: 'src-btwc', name: 'Back to Work Connect', url: 'https://backtoworkconnect.ie/', kind: 'directory', notes: 'Services and listings for returners.' },
];
