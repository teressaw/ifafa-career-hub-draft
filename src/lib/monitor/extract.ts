/**
 * Turns a fetched web page into things a volunteer can use — without guessing.
 * Every suggested field records exactly where it came from ("provenance"), and nothing is inferred from free text
 * except clearly labelled hints that are never filled into the form automatically.
 * Pure functions, no network: easy to test.
 */
import { createHash } from 'node:crypto';

export type DraftField = 'employer' | 'programme_name' | 'summary' | 'description' | 'location' | 'region' | 'work_arrangement' | 'compensation' | 'application_url' | 'source_url' | 'closes_on';

export interface DraftSuggestion {
  kind: 'structured' | 'basic';
  /** Values to pre-fill. Dates are offered as unconfirmed — a volunteer must still tick "dates confirmed". */
  fields: Partial<Record<DraftField, string>>;
  /** For each field, the exact source it was taken from. */
  provenance: Partial<Record<DraftField, string>>;
}

export interface PageExtract {
  title: string;
  description: string;
  siteName: string;
  /** Normalised visible text, used for change detection. */
  text: string;
  hash: string;
  suggestions: DraftSuggestion[];
  /** Sentences that mention dates near words like "closing date". Shown to volunteers as hints only. */
  dateHints: string[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', euro: '€', pound: '£' };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : m; }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const clean = (s: string) => decodeEntities(s).replace(/\s+/g, ' ').trim();

/** Strip HTML to readable text (used for descriptions in structured data, and for change detection). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/header|\/footer)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/[ \t\f\v ]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function metaContent(html: string, key: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /\b(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() === key) { const c = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]; if (c) return clean(c); }
  }
  return '';
}

/* ---------- Structured data (schema.org JobPosting) ---------- */
type Json = Record<string, unknown>;
function* walk(node: unknown): Generator<Json> {
  if (Array.isArray(node)) { for (const n of node) yield* walk(n); return; }
  if (node && typeof node === 'object') {
    const o = node as Json; yield o;
    if (o['@graph']) yield* walk(o['@graph']);
  }
}
const isType = (o: Json, t: string) => { const v = o['@type']; return v === t || (Array.isArray(v) && v.includes(t)); };
const str = (v: unknown): string => (typeof v === 'string' ? clean(v) : typeof v === 'number' ? String(v) : '');

const REGION_WORDS: [RegExp, string][] = [[/\bdublin\b/i, 'dublin'], [/\bcork\b/i, 'cork'], [/\bgalway\b/i, 'galway'], [/\blimerick\b/i, 'limerick'], [/\bwaterford\b/i, 'waterford']];

function money(v: unknown): number | null { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[, ]/g, '')) : NaN; return Number.isFinite(n) && n > 0 ? n : null; }
function formatSalary(base: unknown): string {
  if (!base || typeof base !== 'object') return '';
  const b = base as Json, cur = str(b.currency), value = (b.value && typeof b.value === 'object' ? b.value : b) as Json;
  const unit = str(value.unitText || b.unitText).toLowerCase();
  const sym = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'USD' ? '$' : cur ? cur + ' ' : '';
  const f = (n: number) => sym + n.toLocaleString('en-IE');
  const min = money(value.minValue), max = money(value.maxValue), single = money(value.value);
  const amount = min && max ? `${f(min)}–${f(max)}` : single ? f(single) : min ? `from ${f(min)}` : max ? `up to ${f(max)}` : '';
  const per = { year: 'per year', month: 'per month', week: 'per week', day: 'per day', hour: 'per hour' }[unit] ?? '';
  return amount ? `${amount}${per ? ' ' + per : ''} (as published by the employer)` : '';
}

function firstSentences(text: string, max = 280): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max); const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…');
}

export function jobPostingSuggestion(o: Json, pageUrl: string): DraftSuggestion | null {
  const title = str(o.title) || str(o.name);
  if (!title) return null;
  const fields: DraftSuggestion['fields'] = {}, provenance: DraftSuggestion['provenance'] = {};
  const set = (k: DraftField, v: string, from: string) => { if (v) { fields[k] = v; provenance[k] = from; } };
  set('programme_name', title.slice(0, 160), `JobPosting.title: “${title.slice(0, 120)}”`);
  const org = o.hiringOrganization; const orgName = typeof org === 'string' ? clean(org) : org && typeof org === 'object' ? str((org as Json).name) : '';
  set('employer', orgName.slice(0, 120), `JobPosting.hiringOrganization.name: “${orgName.slice(0, 120)}”`);
  const desc = typeof o.description === 'string' ? htmlToText(o.description) : '';
  if (desc) { set('description', desc.slice(0, 6000), 'JobPosting.description (full text from the page)'); set('summary', firstSentences(desc), 'First sentence(s) of JobPosting.description'); }
  const locs = ([] as unknown[]).concat(o.jobLocation ?? []).map(l => (l && typeof l === 'object' ? (l as Json).address : null)).filter(Boolean) as Json[];
  const locText = locs.map(a => [str(a.addressLocality), str(a.addressRegion)].filter(Boolean).join(', ')).filter(Boolean);
  if (locText.length) {
    set('location', [...new Set(locText)].join(' · ').slice(0, 120), `JobPosting.jobLocation.address: “${locText.join(' · ').slice(0, 120)}”`);
    const regions = new Set(locText.map(t => REGION_WORDS.find(([re]) => re.test(t))?.[1] ?? (/ireland|\bIE\b/i.test(JSON.stringify(locs)) ? 'other-ireland' : '')).filter(Boolean));
    if (regions.size === 1) set('region', [...regions][0], `Matched from the location “${locText[0]}”`); else if (regions.size > 1) set('region', 'multiple', 'Several locations listed in JobPosting.jobLocation');
  }
  if (str(o.jobLocationType).toUpperCase() === 'TELECOMMUTE') set('work_arrangement', 'remote', 'JobPosting.jobLocationType: “TELECOMMUTE”');
  set('compensation', formatSalary(o.baseSalary), 'JobPosting.baseSalary');
  const until = str(o.validThrough);
  if (/^\d{4}-\d{2}-\d{2}/.test(until)) set('closes_on', until.slice(0, 10), `JobPosting.validThrough: “${until}” — confirm this is the application closing date`);
  const applyUrl = str(o.url);
  if (/^https?:\/\//i.test(applyUrl)) set('application_url', applyUrl, 'JobPosting.url');
  set('source_url', pageUrl, 'The page you checked');
  return { kind: 'structured', fields, provenance };
}

function structuredSuggestions(html: string, pageUrl: string): DraftSuggestion[] {
  const out: DraftSuggestion[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown; try { data = JSON.parse(m[1].trim()); } catch { continue; }
    for (const node of walk(data)) if (isType(node, 'JobPosting')) { const s = jobPostingSuggestion(node, pageUrl); if (s) out.push(s); }
  }
  return out.slice(0, 20);
}

/* ---------- Hints: sentences with dates near application words ---------- */
const MONTH = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DATE_RE = new RegExp(`\\b(\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}(?:\\s+\\d{4})?|${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?|\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|${MONTH}\\s+\\d{4})\\b`, 'i');
const KEY_RE = /\b(clos(?:e|es|ing)|deadline|apply by|applications? (?:open|close|are open|will open)|opens? on|start(?:s|ing)? (?:on|in)|intake|commenc)/i;
export function dateHints(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 12 && s.length < 260);
  return [...new Set(sentences.filter(s => KEY_RE.test(s) && DATE_RE.test(s)))].slice(0, 6);
}

/* ---------- Change detection ---------- */
export function sentenceSet(text: string): Set<string> {
  return new Set(text.split(/(?<=[.!?])\s+|\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length >= 20 && s.length <= 300));
}
export function diffText(before: string, after: string, max = 6): { added: string[]; removed: string[] } {
  const a = sentenceSet(before), b = sentenceSet(after);
  return { added: [...b].filter(s => !a.has(s)).slice(0, max), removed: [...a].filter(s => !b.has(s)).slice(0, max) };
}

export function extractPage(html: string, pageUrl: string): PageExtract {
  const text = htmlToText(html).slice(0, 100_000);
  const title = clean(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '') || metaContent(html, 'og:title');
  const description = metaContent(html, 'description') || metaContent(html, 'og:description');
  const siteName = metaContent(html, 'og:site_name');
  const suggestions = structuredSuggestions(html, pageUrl);
  if (!suggestions.length) {
    const fields: DraftSuggestion['fields'] = {}, provenance: DraftSuggestion['provenance'] = {};
    const ogTitle = metaContent(html, 'og:title') || title;
    if (ogTitle) { fields.programme_name = ogTitle.slice(0, 160); provenance.programme_name = `Page title: “${ogTitle.slice(0, 120)}”`; }
    if (siteName) { fields.employer = siteName.slice(0, 120); provenance.employer = `Site name (og:site_name): “${siteName}”`; }
    if (description) { fields.summary = description.slice(0, 300); provenance.summary = 'Page description (meta description)'; }
    fields.source_url = pageUrl; provenance.source_url = 'The page you checked';
    suggestions.push({ kind: 'basic', fields, provenance });
  }
  return { title, description, siteName, text, hash: createHash('sha256').update(text).digest('hex'), suggestions, dateHints: dateHints(text) };
}
