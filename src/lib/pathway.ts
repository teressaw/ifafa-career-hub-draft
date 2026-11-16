/**
 * Employer pathway builder: turns an employer's choices into a practical starting plan for a
 * return-to-work pathway. Entirely rule-based: the same answers always give the same plan, nothing
 * is sent anywhere, and no claim is made that the plan satisfies employment law.
 */

export const GOALS = {
  hiring: 'Fill roles we struggle to hire for',
  pool: 'Reach experienced people our usual hiring misses',
  alumni: 'Bring back former colleagues',
  balance: 'Improve representation at mid and senior levels',
  pilot: 'Test a new hiring route before committing',
} as const;
export const SIZES = { small: 'Fewer than 50 people', medium: '50 to 249 people', large: '250 people or more' } as const;
export const PLACES = { one: '1 place', few: '2 to 5 places', cohort: '6 or more places' } as const;
export const TIME_AWAY = { any: 'No minimum', '1y': 'About 1 year or more', '2y': 'About 2 years or more' } as const;
export const REASONS = { any: 'Any reason. We won’t ask why', caring: 'Caring responsibilities only' } as const;
export const LEVELS = { any: 'Any level', mid: 'Mid-level', senior: 'Senior or specialist' } as const;
export const VACANCY = { real: 'Yes, each place has a real role behind it', some: 'Some do', none: 'No. We’d look for roles afterwards' } as const;
export const HOURS = { full: 'Full-time only', part: 'Part-time available', flexible: 'Flexible hours agreed with each person' } as const;
export const PLACE_OF_WORK = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote within Ireland' } as const;
export const FORMATS = {
  returnship: 'Fixed-term returnship, with the intention of a permanent role afterwards',
  supported: 'Supported hire: a permanent role from day one, with extra support',
} as const;
export const LENGTHS = { '12': '12 weeks', '16': '16 weeks', '24': '24 weeks' } as const;
export const APPLY = { cv: 'CV and cover letter', form: 'A short form, CV optional', chat: 'An informal conversation first' } as const;
export const ASSESS = { interview: 'Structured interview', work: 'A short, relevant work sample', panel: 'Panel interview' } as const;
export const SUPPORTS = {
  buddy: 'A buddy in the team',
  mentor: 'A mentor outside the reporting line',
  coaching: 'Professional coaching',
  refresher: 'Refresher training on tools and practice',
  phased: 'A phased start (building up hours)',
  checkins: 'Scheduled check-ins with the manager',
} as const;
export const PAY = { rate: 'The normal rate for the role', reduced: 'A lower programme rate or stipend', undecided: 'Not decided yet' } as const;
export const MEASURES = {
  conversion: 'How many move into ongoing roles',
  retention: 'Who is still with us after 12 months',
  feedback: 'Feedback from participants and managers',
  applications: 'Who applied, and who we turned away',
  progression: 'Progression and pay after two years',
} as const;

export interface PathwayInput {
  organisation: string;
  roles: string;
  goals: (keyof typeof GOALS)[];
  size: keyof typeof SIZES;
  sponsor: boolean;
  places: keyof typeof PLACES;
  timeAway: keyof typeof TIME_AWAY;
  reasons: keyof typeof REASONS;
  level: keyof typeof LEVELS;
  vacancy: keyof typeof VACANCY;
  hours: keyof typeof HOURS;
  place: keyof typeof PLACE_OF_WORK;
  format: keyof typeof FORMATS;
  length: keyof typeof LENGTHS;
  /** YYYY-MM, or '' when not decided. */
  start: string;
  apply: keyof typeof APPLY;
  assess: (keyof typeof ASSESS)[];
  supports: (keyof typeof SUPPORTS)[];
  managerBriefing: boolean;
  pay: keyof typeof PAY;
  measures: (keyof typeof MEASURES)[];
}

export const DEFAULT_INPUT: PathwayInput = {
  organisation: '', roles: '', goals: [], size: 'medium', sponsor: false, places: 'few', timeAway: '1y', reasons: 'any', level: 'any',
  vacancy: 'real', hours: 'flexible', place: 'hybrid', format: 'returnship', length: '24', start: '', apply: 'form',
  assess: ['interview'], supports: ['buddy', 'checkins'], managerBriefing: true, pay: 'rate', measures: ['conversion', 'feedback'],
};

const has = <T extends string>(map: Record<T, string>, v: unknown): v is T => typeof v === 'string' && v in map;
const list = <T extends string>(map: Record<T, string>, v: unknown): T[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => has(map, x)))] : []);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');

/** Accepts anything (for example, data restored from the browser) and returns a safe, complete input. */
export function sanitiseInput(raw: unknown): PathwayInput {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_INPUT;
  return {
    organisation: text(r.organisation, 80), roles: text(r.roles, 200),
    goals: list(GOALS, r.goals), size: has(SIZES, r.size) ? r.size : d.size, sponsor: r.sponsor === true,
    places: has(PLACES, r.places) ? r.places : d.places, timeAway: has(TIME_AWAY, r.timeAway) ? r.timeAway : d.timeAway,
    reasons: has(REASONS, r.reasons) ? r.reasons : d.reasons, level: has(LEVELS, r.level) ? r.level : d.level,
    vacancy: has(VACANCY, r.vacancy) ? r.vacancy : d.vacancy, hours: has(HOURS, r.hours) ? r.hours : d.hours,
    place: has(PLACE_OF_WORK, r.place) ? r.place : d.place, format: has(FORMATS, r.format) ? r.format : d.format,
    length: has(LENGTHS, r.length) ? r.length : d.length, start: typeof r.start === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(r.start) ? r.start : '',
    apply: has(APPLY, r.apply) ? r.apply : d.apply, assess: list(ASSESS, r.assess), supports: list(SUPPORTS, r.supports),
    managerBriefing: r.managerBriefing === true, pay: has(PAY, r.pay) ? r.pay : d.pay, measures: list(MEASURES, r.measures),
  };
}

export interface PlanSection { id: string; title: string; intro?: string; points: string[] }
export interface PlanStep { when: string; what: string }
export interface Plan {
  title: string;
  summary: string;
  /** Choices worth a second look, most important first. */
  reconsider: { title: string; why: string }[];
  sections: PlanSection[];
  timeline: PlanStep[];
  /** What a candidate will want to know. Matches the fields Workbreak shows on a listing. */
  listing: { label: string; value: string }[];
  caveat: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function monthLabel(ym: string, offset = 0): string {
  const [y, m] = ym.split('-').map(Number);
  const i = y * 12 + (m - 1) + offset;
  return `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;
}

export const CAVEAT =
  'This is a starting plan, not legal or HR advice. Contracts, pay, equality and fixed-term work are regulated in Ireland; ' +
  'confirm the details with your HR lead or an employment-law adviser before you advertise.';

export function buildPlan(input: PathwayInput): Plan {
  const i = sanitiseInput(input);
  const org = i.organisation || 'Your organisation';
  const weeks = Number(i.length);
  const returnship = i.format === 'returnship';
  const single = i.places === 'one';
  const reconsider: Plan['reconsider'] = [];

  if (i.pay !== 'rate') reconsider.push({
    title: i.pay === 'reduced' ? 'Paying below the rate for the role' : 'Pay is not decided',
    why: 'People on this pathway will do real work at their level. Paying the normal rate is the clearest signal that you see it that way, and “pay not stated” is the first thing candidates notice. Decide the figure, or at least the range, before advertising.',
  });
  if (i.vacancy === 'none') reconsider.push({
    title: 'No role waiting at the end',
    why: 'A programme with nowhere to go asks people to rearrange their lives for a trial. If you cannot commit roles, say so plainly in the advert and tell participants by the midpoint where they stand.',
  });
  else if (i.vacancy === 'some') reconsider.push({
    title: 'Only some places have a role behind them',
    why: 'Tell each candidate, before they accept, whether their place has a role behind it. Finding out in the final week is the commonest complaint about returnships.',
  });
  if (i.reasons === 'caring') reconsider.push({
    title: 'Limiting eligibility to caring',
    why: 'People step away from paid work for many reasons: illness, moving country, redundancy, bereavement. Restricting by reason means asking candidates to disclose and justify private circumstances, and may raise equality questions. A minimum time away, with no reason required, is simpler and fairer. Take advice if you keep this restriction.',
  });
  if (i.hours === 'full') reconsider.push({
    title: 'Full-time only',
    why: 'Many people returning still have the commitments that took them out of paid work. Offering part-time or agreed flexible hours usually widens the field more than any other single choice.',
  });
  if (!i.managerBriefing) reconsider.push({
    title: 'No preparation for line managers',
    why: 'The line manager decides whether this works. An hour’s briefing before the first day (what to expect, what not to assume, how feedback will work) prevents most early problems.',
  });
  if (!i.sponsor) reconsider.push({
    title: 'No senior sponsor yet',
    why: 'Someone senior needs to own the headcount and the decision about roles at the end. Name them before you advertise.',
  });
  if (returnship && weeks === 12 && i.level === 'senior') reconsider.push({
    title: 'Twelve weeks is short for senior roles',
    why: 'Senior and specialist work takes longer to settle into. Sixteen to twenty-four weeks gives both sides a fair basis for a decision.',
  });
  if (i.timeAway === '2y') reconsider.push({
    title: 'A two-year minimum excludes people',
    why: 'Someone away for eighteen months faces most of the same barriers. Consider “about a year or more”, applied with judgement.',
  });
  if (i.supports.length === 0) reconsider.push({
    title: 'No named support',
    why: 'Without at least a buddy and scheduled check-ins, this is an ordinary hire with a different label.',
  });
  if (i.assess.includes('panel') && !i.assess.includes('work')) reconsider.push({
    title: 'Panel interviews favour recent practice',
    why: 'Interviewing is itself a skill that fades. A short, relevant work sample shows what someone can do; a panel mostly shows how recently they last interviewed.',
  });

  const eligibility = [
    i.timeAway === 'any' ? 'Open to people returning to paid work after time away, however long.' : `Open to people who have been out of paid work in this field for ${i.timeAway === '1y' ? 'about a year or more' : 'about two years or more'}. Treat this as a guide, not a cut-off.`,
    i.reasons === 'any' ? 'Any reason for the time away. Candidates are not asked to explain or account for it.' : 'Currently limited to people who stepped away for caring responsibilities (see “Worth a second look”).',
    `Experience: ${LEVELS[i.level].toLowerCase()}${i.roles ? `, relevant to ${i.roles}` : ''}. Describe the experience you need, not the years since it was gained.`,
    'State plainly what is required (for example, the right to work in Ireland, or a professional registration) and what is not.',
  ];

  const structure = [
    returnship
      ? `${LENGTHS[i.length]}, fixed-term, ${single ? 'for one person' : 'as a small cohort starting together'}, with the stated intention of an ongoing role for those who want one and are doing the job well.`
      : `A permanent role from the first day, with a defined support period of about ${LENGTHS[i.length]}.`,
    `Hours: ${HOURS[i.hours].toLowerCase()}. Place of work: ${PLACE_OF_WORK[i.place].toLowerCase()}. Put both in the advert.`,
    'Real work from the first month: a defined role in a team, with objectives the person helped set. Not shadowing, and not a project nobody needed.',
    returnship ? `A review at the midpoint (about week ${Math.round(weeks / 2)}) where the manager says honestly how it is going and what happens at the end.` : 'A review at the end of the support period to agree what, if anything, should continue.',
    returnship ? `A decision about ongoing roles communicated at least ${weeks >= 24 ? 'four' : 'three'} weeks before the end date.` : 'The same probation terms as any other new colleague, no longer.',
  ];

  const recruitment = [
    `How to apply: ${APPLY[i.apply].toLowerCase()}.${i.apply === 'cv' ? ' Say explicitly that a CV with years outside paid work is expected and welcome.' : ''}`,
    'Tell your recruiters and any screening software not to reject applications for dates. This is where most returners are lost, usually without anyone deciding it.',
    i.assess.length ? `Assessment: ${i.assess.map(a => ASSESS[a].toLowerCase()).join(', ')}. Share the format and timings in advance.` : 'Decide how you will assess, and share the format and timings in advance.',
    'Ask about what candidates can do and want to do. Do not ask them to account for the time away, and do not ask about childcare or health.',
    'Advertise where people who are not job-hunting will see it, and give a named contact for questions.',
    'Reply to everyone who applies. Offer brief feedback to everyone you interview.',
  ];

  const support = [
    ...i.supports.map(s => ({
      buddy: 'A buddy in the team for everyday questions, introduced before the first day.',
      mentor: 'A mentor outside the reporting line, meeting monthly.',
      coaching: 'Professional coaching sessions, booked into working hours and confidential.',
      refresher: 'Refresher training on current tools and practice in the first weeks, alongside real work.',
      phased: 'A phased start: hours build up over the first weeks to an agreed pattern.',
      checkins: 'Check-ins with the manager: weekly for the first month, then fortnightly.',
    }[s])),
    'A first week that is planned: equipment and access ready, the team told who is joining and why, and a first piece of work lined up.',
    single ? 'With one participant there is no cohort, so introduce them to others who joined after time away, if they would like that.' : 'Time for the cohort to meet each other regularly. Peer support is consistently what participants value most.',
  ];

  const managers = [
    i.managerBriefing ? 'Brief every line manager before the first day: what the pathway is, what to expect in the first month, and how reviews will work.' : 'Add a briefing for line managers before the first day (see “Worth a second look”).',
    'Expect capability to return faster than confidence. Give specific feedback early and often.',
    'Agree working hours and flexibility at the start, and treat the agreement as settled, not as a favour.',
    'Managers should know who to go to if things are not working, well before the final review.',
  ];

  const pay = [
    i.pay === 'rate' ? 'Paid at the normal rate for the role and level. State the salary or range in the advert.' : i.pay === 'reduced' ? 'A programme rate below the normal rate for the role (see “Worth a second look”). State the figure in the advert.' : 'Pay to be decided (see “Worth a second look”).',
    'The same leave, benefits and access to training as colleagues on comparable contracts, from the first day.',
    returnship ? 'A written fixed-term contract that states the end date and what happens at the end.' : 'A standard permanent contract.',
    CAVEAT,
  ];

  const measures = [
    ...(i.measures.length ? i.measures : (['conversion', 'feedback'] as const)).map(m => ({
      conversion: 'Of those who finish, how many move into ongoing roles, and at what level and pay.',
      retention: 'How many are still with you 12 months after the programme ends.',
      feedback: 'What participants and managers say, gathered at the midpoint and the end by someone outside the reporting line.',
      applications: 'Who applied, who was interviewed and who was turned away, to check the process is not screening out the people it was built for.',
      progression: 'Pay and progression two years on, compared with colleagues hired the usual way.',
    }[m])),
    'Decide now who will collect these and when you will look at them. One page at the end is enough.',
  ];

  const sections: PlanSection[] = [
    { id: 'purpose', title: 'Why you are doing this', points: [
      i.goals.length ? `Your aims: ${i.goals.map(g => GOALS[g].toLowerCase()).join('; ')}.` : 'You have not chosen aims yet. Agree one or two before designing anything else: they decide what success means.',
      i.sponsor ? 'A senior sponsor owns the headcount and the decision about roles at the end.' : 'Senior sponsor: to be named.',
      `${PLACES[i.places]}${i.roles ? ` in ${i.roles}` : ''}. ${i.size === 'small' ? 'In a small organisation one well-supported place is a complete pathway. You do not need a programme.' : single ? 'Starting with one place is a sound way to learn.' : 'Keep the first intake small enough that every manager involved is briefed.'}`,
    ] },
    { id: 'eligibility', title: 'Who it is for', intro: 'Draft wording you can adapt for the advert.', points: eligibility },
    { id: 'structure', title: 'Shape of the pathway', points: structure },
    { id: 'recruitment', title: 'Finding and choosing people', points: recruitment },
    { id: 'support', title: 'Support once they start', points: support },
    { id: 'managers', title: 'Preparing managers', points: managers },
    { id: 'pay', title: 'Pay and conditions', points: pay },
    { id: 'measures', title: 'How you will know it worked', points: measures },
  ];

  const when = (offset: number, fallback: string) => (i.start ? monthLabel(i.start, offset) : fallback);
  const endOffset = Math.round(weeks / 4.345);
  const timeline: PlanStep[] = [
    { when: when(-4, '4 months before the start'), what: `Agree aims, ${i.sponsor ? 'confirm' : 'name'} the sponsor, confirm the roles${i.vacancy === 'real' ? '' : ' and what happens at the end'}, and settle pay.` },
    { when: when(-3, '3 months before'), what: 'Write the advert and eligibility wording. Brief recruiters; check that screening does not reject on dates. Open applications.' },
    { when: when(-2, '2 months before'), what: 'Shortlist and assess. Reply to everyone.' },
    { when: when(-1, '1 month before'), what: `Make offers and agree hours. ${i.managerBriefing ? 'Brief line managers. ' : ''}Arrange equipment, access${i.supports.includes('buddy') ? ' and buddies' : ''}.` },
    { when: when(0, 'Start'), what: 'First day. A planned first week and a first piece of real work.' },
    ...(returnship ? [{ when: when(Math.max(1, Math.round(endOffset / 2)), 'Midpoint'), what: 'Midpoint review: honest feedback both ways, and where each person stands on an ongoing role.' }] : []),
    { when: when(endOffset, returnship ? 'End of the programme' : 'End of the support period'), what: returnship ? 'Decisions on ongoing roles already communicated. Gather feedback; record the measures.' : 'Review the support; gather feedback; record the measures.' },
    { when: when(endOffset + 1, 'One month after'), what: 'Review what you learned and decide whether, and how, to run it again.' },
  ];

  const listing = [
    { label: 'Kind of opportunity', value: returnship ? 'Returnship' : 'Returner-friendly role' },
    { label: 'Roles', value: i.roles || 'Not yet stated' },
    { label: 'Eligibility', value: `${TIME_AWAY[i.timeAway]} away from paid work; ${i.reasons === 'any' ? 'any reason' : 'caring responsibilities'}; ${LEVELS[i.level].toLowerCase()}` },
    { label: 'Duration', value: returnship ? LENGTHS[i.length] : 'Permanent' },
    { label: 'Hours and place', value: `${HOURS[i.hours]}; ${PLACE_OF_WORK[i.place].toLowerCase()}` },
    { label: 'Pay', value: i.pay === 'rate' ? 'Normal rate for the role (state the range)' : i.pay === 'reduced' ? 'Programme rate (state the figure)' : 'Not decided' },
    { label: 'Start', value: i.start ? monthLabel(i.start) : 'Not decided' },
    { label: 'What happens at the end', value: !returnship ? 'Role continues' : i.vacancy === 'real' ? 'Ongoing role intended for each place' : i.vacancy === 'some' ? 'Ongoing role for some places' : 'No role committed' },
  ];

  const summary = returnship
    ? `${org} plans a ${weeks}-week paid returnship${i.roles ? ` in ${i.roles}` : ''} with ${PLACES[i.places].replace(/^1 place$/, 'one place')}${i.start ? `, starting in ${monthLabel(i.start)}` : ''}.`
    : `${org} plans to hire${i.roles ? ` in ${i.roles}` : ''} through a supported route: permanent from day one, with about ${weeks} weeks of structured support${i.start ? `, starting in ${monthLabel(i.start)}` : ''}.`;

  return { title: `${org}: return-to-work pathway, starting plan`, summary, reconsider, sections, timeline, listing, caveat: CAVEAT };
}

/** Plain-text version for copying into an email or document. */
export function planToText(plan: Plan): string {
  const out: string[] = [plan.title.toUpperCase(), '', plan.summary, ''];
  if (plan.reconsider.length) {
    out.push('WORTH A SECOND LOOK', '');
    for (const r of plan.reconsider) out.push(`* ${r.title}: ${r.why}`);
    out.push('');
  }
  for (const s of plan.sections) {
    out.push(s.title.toUpperCase());
    if (s.intro) out.push(s.intro);
    out.push('');
    for (const p of s.points) out.push(`- ${p}`);
    out.push('');
  }
  out.push('SEQUENCE', '');
  for (const t of plan.timeline) out.push(`${t.when}: ${t.what}`);
  out.push('', 'WHAT CANDIDATES WILL WANT TO KNOW', '');
  for (const l of plan.listing) out.push(`${l.label}: ${l.value}`);
  out.push('', plan.caveat, '', 'Made with the Workbreak pathway builder.');
  return out.join('\n');
}
