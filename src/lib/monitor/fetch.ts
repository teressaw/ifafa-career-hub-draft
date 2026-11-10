import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { robotsAllows, robotsRules } from './robots';

/**
 * A polite, safe fetcher for public web pages.
 *  - Identifies itself and links to the "How listings work" page.
 *  - Obeys robots.txt for every site.
 *  - Refuses internal/private network addresses (prevents misuse of the server), non-web URLs and odd ports.
 *  - Caps time (10 s) and size (2.5 MB), and follows at most 4 redirects, re-checking each one.
 */
export const USER_AGENT = 'IFAFA-CareerHub/1.0 (+https://ifafa-career-hub.vercel.app/about; volunteer-run listing checker)';
const MAX_BYTES = 2_500_000;
const TIMEOUT_MS = 10_000;

export type FetchOutcome =
  | { ok: true; url: string; html: string; status: number }
  | { ok: false; reason: 'invalid' | 'blocked-network' | 'robots' | 'robots-unknown' | 'http' | 'not-html' | 'too-large' | 'timeout' | 'network'; message: string; status?: number };

function isPrivateAddress(ip: string): boolean {
  if (ip.includes(':')) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::' || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('fc') || v.startsWith('fd')) return true;
    const mapped = /::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v); return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export function parsePublicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    if (u.port && u.port !== '80' && u.port !== '443') return null;
    if (!u.hostname.includes('.') || u.hostname.endsWith('.local') || u.hostname.endsWith('.internal')) return null;
    u.hash = '';
    return u;
  } catch { return null; }
}

async function hostIsPublic(host: string): Promise<boolean> {
  if (isIP(host)) return !isPrivateAddress(host);
  try { const addrs = await lookup(host, { all: true }); return addrs.length > 0 && addrs.every(a => !isPrivateAddress(a.address)); }
  catch { return false; }
}

async function readCapped(res: Response, cap: number): Promise<string | null> {
  const reader = res.body?.getReader(); if (!reader) return '';
  const chunks: Uint8Array[] = []; let total = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength; if (total > cap) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks));
}

async function rawGet(start: URL, accept: string, cap: number): Promise<FetchOutcome> {
  let url = start;
  for (let hop = 0; hop <= 4; hop++) {
    if (!(await hostIsPublic(url.hostname))) return { ok: false, reason: 'blocked-network', message: 'That address is not a public website.' };
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try { res = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': USER_AGENT, accept, 'accept-language': 'en-IE,en;q=0.9' }, cache: 'no-store' }); }
    catch (e) { clearTimeout(timer); return (e as Error).name === 'AbortError' ? { ok: false, reason: 'timeout', message: 'The site took too long to respond.' } : { ok: false, reason: 'network', message: 'The site could not be reached.' }; }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      clearTimeout(timer);
      const next = parsePublicUrl(new URL(res.headers.get('location')!, url).toString());
      if (!next) return { ok: false, reason: 'invalid', message: 'The site redirected to an address we cannot check.' };
      url = next; continue;
    }
    try {
      const body = await readCapped(res, cap); clearTimeout(timer);
      if (body === null) return { ok: false, reason: 'too-large', message: 'The page is too large to check.' };
      if (!res.ok) return { ok: false, reason: 'http', status: res.status, message: `The site answered with an error (${res.status}).` };
      return { ok: true, url: url.toString(), html: body, status: res.status };
    } catch { clearTimeout(timer); return { ok: false, reason: 'timeout', message: 'The site took too long to respond.' }; }
  }
  return { ok: false, reason: 'invalid', message: 'The site redirected too many times.' };
}

/** Fetch a public HTML page, after checking the site's robots.txt allows it. */
export async function politeFetch(raw: string): Promise<FetchOutcome> {
  const url = parsePublicUrl(raw);
  if (!url) return { ok: false, reason: 'invalid', message: 'Enter a full public web address starting with https://' };
  const robots = await rawGet(new URL('/robots.txt', url), 'text/plain', 500_000);
  if (robots.ok) {
    if (!robotsAllows(robotsRules(robots.html), url.pathname + url.search)) return { ok: false, reason: 'robots', message: 'This site asks automated tools not to read this page (robots.txt). Check it by hand instead.' };
  } else if (robots.reason === 'http' && robots.status && robots.status >= 500) {
    return { ok: false, reason: 'robots-unknown', message: 'We could not read this site’s rules for automated tools, so we did not check it. Try again later.' };
  }
  const page = await rawGet(url, 'text/html,application/xhtml+xml', MAX_BYTES);
  if (!page.ok) return page;
  if (!/<html|<!doctype html|<head|<body/i.test(page.html.slice(0, 5000))) return { ok: false, reason: 'not-html', message: 'That address is not a web page.' };
  return page;
}
