import 'server-only';
import { politeFetch } from './fetch';
import { diffText, extractPage, type DraftSuggestion } from './extract';
import type { SourceStatus } from './sources';

export interface CheckResult {
  status: SourceStatus;
  checkedAt: string;
  message: string;
  hash: string | null;
  snapshot: string | null;
  change: { added: string[]; removed: string[]; dateHints: string[] } | null;
  suggestions: DraftSuggestion[];
  pageTitle: string;
}

/** Check one page against what we saw last time. Never throws. */
export async function checkPage(url: string, previous: { hash: string | null; snapshot: string | null }): Promise<CheckResult> {
  const checkedAt = new Date().toISOString();
  const res = await politeFetch(url);
  if (!res.ok) return { status: res.reason === 'robots' ? 'blocked' : 'error', checkedAt, message: res.message, hash: previous.hash, snapshot: previous.snapshot, change: null, suggestions: [], pageTitle: '' };
  const page = extractPage(res.html, res.url);
  const structured = page.suggestions.filter(s => s.kind === 'structured');
  if (!previous.hash) {
    return { status: 'unchanged', checkedAt, message: structured.length ? `First check done. Found ${structured.length} job posting${structured.length === 1 ? '' : 's'} with structured details.` : 'First check done. We will flag any future changes to this page.', hash: page.hash, snapshot: page.text.slice(0, 50_000), change: { added: [], removed: [], dateHints: page.dateHints }, suggestions: structured, pageTitle: page.title };
  }
  if (previous.hash === page.hash) {
    return { status: 'unchanged', checkedAt, message: 'No change since the last check.', hash: page.hash, snapshot: previous.snapshot, change: null, suggestions: structured, pageTitle: page.title };
  }
  const d = diffText(previous.snapshot ?? '', page.text);
  return { status: 'changed', checkedAt, message: 'The page has changed since the last check.', hash: page.hash, snapshot: page.text.slice(0, 50_000), change: { ...d, dateHints: page.dateHints }, suggestions: structured, pageTitle: page.title };
}

/** Best-effort, per-instance memory cache so repeated demo clicks don't hammer real sites. */
const cache = new Map<string, { at: number; result: CheckResult }>();
export async function checkPageCached(url: string, minutes = 15): Promise<CheckResult> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < minutes * 60_000) return hit.result;
  const result = await checkPage(url, { hash: null, snapshot: null });
  if (cache.size > 200) cache.clear();
  cache.set(url, { at: Date.now(), result });
  return result;
}
