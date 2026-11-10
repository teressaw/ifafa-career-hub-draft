// Unit tests for the rules that protect accuracy. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applicationStatus, needsVerification } from '../src/lib/status';
import { validateOpportunity, slugify } from '../src/lib/validation';
import { applyQuery, parseQuery } from '../src/lib/filters';
import { sampleOpportunities } from '../src/lib/sample-data';

const T = '2026-11-10';
const base = { last_verified_on: '2026-11-01', dates_verified: false, opens_on: null, closes_on: null, recorded_status: null } as const;

test('never verified → unverified', () => assert.equal(applicationStatus({ ...base, last_verified_on: null }, T).status, 'unverified'));
test('verified long ago → unverified, even with verified open dates', () =>
  assert.equal(applicationStatus({ ...base, last_verified_on: '2026-06-01', dates_verified: true, opens_on: '2026-10-01', closes_on: '2026-12-31' }, T).status, 'unverified'));
test('verified dates → open / upcoming / closed', () => {
  assert.equal(applicationStatus({ ...base, dates_verified: true, opens_on: '2026-11-01', closes_on: '2026-11-30' }, T).status, 'open');
  assert.equal(applicationStatus({ ...base, dates_verified: true, opens_on: '2026-12-01' }, T).status, 'upcoming');
  assert.equal(applicationStatus({ ...base, dates_verified: true, closes_on: '2026-11-09' }, T).status, 'closed');
  assert.equal(applicationStatus({ ...base, dates_verified: true, closes_on: '2026-11-10' }, T).status, 'open', 'open on its closing day');
});
test('unverified dates are ignored', () => assert.equal(applicationStatus({ ...base, dates_verified: false, opens_on: '2026-11-01', closes_on: '2026-11-30' }, T).status, 'unverified'));
test('recorded status used when no verified dates', () => assert.equal(applicationStatus({ ...base, recorded_status: 'open' }, T).status, 'open'));
test('needsVerification after 120 days', () => { assert.ok(needsVerification({ last_verified_on: '2026-07-01' }, T)); assert.ok(!needsVerification({ last_verified_on: '2026-10-01' }, T)); });

function fd(o: Record<string, string>) { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; }
const good = { employer: 'Acme', programme_name: 'Return to Work', summary: 'A programme summary.', description: 'A long enough description of the programme.', location: 'Dublin', region: 'dublin', work_arrangement: 'hybrid', programme_type: 'returnship', career_break: 'not-specified', sector: 'technology', source_url: 'https://acme.ie/careers' };

test('valid listing passes', () => assert.ok(validateOpportunity(fd(good)).data));
test('missing required fields fail', () => { const { errors } = validateOpportunity(fd({})); for (const k of ['employer', 'programme_name', 'summary', 'description', 'location', 'region', 'source_url']) assert.ok(errors[k], k); });
test('unconfirmed dates are rejected', () => assert.ok(validateOpportunity(fd({ ...good, closes_on: '2026-12-01' })).errors.dates_verified));
test('dates_verified without dates is rejected', () => assert.ok(validateOpportunity(fd({ ...good, dates_verified: 'on' })).errors.dates_verified));
test('closing before opening is rejected', () => assert.ok(validateOpportunity(fd({ ...good, dates_verified: 'on', opens_on: '2026-12-10', closes_on: '2026-12-01' })).errors.closes_on));
test('non-web links are rejected', () => {
  assert.ok(validateOpportunity(fd({ ...good, source_url: 'javascript:alert(1)' })).errors.source_url);
  assert.ok(validateOpportunity(fd({ ...good, application_url: 'ftp://x.ie' })).errors.application_url);
});
test('unknown enum values are rejected', () => assert.ok(validateOpportunity(fd({ ...good, sector: 'astrology' })).errors.sector));
test('slugify', () => assert.equal(slugify('Ériu & Co.', 'Return–to–Work 2027'), 'eriu-and-co-return-to-work-2027'));

test('filters: unknown params ignored, status filter works', () => {
  const q = parseQuery({ status: 'open', sector: 'not-a-sector', q: '  data  ' });
  assert.equal(q.sector, ''); assert.equal(q.q, 'data');
  const r = applyQuery(sampleOpportunities(), q);
  assert.ok(r.length >= 1 && r.every(o => o.appStatus === 'open'));
});
test('examples cover all four statuses', () => {
  const s = new Set(applyQuery(sampleOpportunities(), parseQuery({})).map(o => o.appStatus));
  assert.deepEqual([...s].sort(), ['closed', 'open', 'unverified', 'upcoming']);
});

/* ---------- Monitoring: extraction never guesses, and always says where a value came from ---------- */
import { extractPage, diffText, dateHints } from '../src/lib/monitor/extract';
import { robotsAllows, robotsRules } from '../src/lib/monitor/robots';

const jobPage = `<html><head><title>Careers | Example Ltd</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"X"},
{"@type":"JobPosting","title":"Returner Programme &ndash; Finance","hiringOrganization":{"@type":"Organization","name":"Example Ltd"},
"description":"<p>A 16-week paid returnship for people who have taken a career break. You will join the finance team.</p><p>Hybrid working.</p>",
"jobLocation":{"@type":"Place","address":{"addressLocality":"Cork","addressCountry":"IE"}},
"validThrough":"2026-12-05T23:59","url":"https://example.org/apply/123"}]}</script></head><body><p>Apply now.</p></body></html>`;

test('JobPosting fields are mapped with provenance', () => {
  const s = extractPage(jobPage, 'https://example.org/careers').suggestions;
  assert.equal(s.length, 1);
  const { fields: f, provenance: p, kind } = s[0];
  assert.equal(kind, 'structured');
  assert.equal(f.programme_name, 'Returner Programme – Finance');
  assert.equal(f.employer, 'Example Ltd');
  assert.equal(f.location, 'Cork');
  assert.equal(f.region, 'cork');
  assert.equal(f.closes_on, '2026-12-05');
  assert.match(p.closes_on!, /confirm/);
  assert.equal(f.application_url, 'https://example.org/apply/123');
  assert.ok(!f.description!.includes('<p>'));
  for (const k of Object.keys(f)) assert.ok(p[k as keyof typeof p], `provenance for ${k}`);
});

test('missing facts stay empty — no pay, no work arrangement invented', () => {
  const f = extractPage(jobPage, 'https://example.org/careers').suggestions[0].fields;
  assert.equal(f.compensation, undefined);
  assert.equal(f.work_arrangement, undefined); // "Hybrid working" in prose is not treated as a fact
});

test('pages without structured data give only a basic draft', () => {
  const s = extractPage('<title>Returners | Acme</title><meta name="description" content="Our returner programme.">', 'https://acme.example/r').suggestions;
  assert.equal(s.length, 1); assert.equal(s[0].kind, 'basic');
  assert.equal(s[0].fields.closes_on, undefined);
  assert.equal(s[0].fields.summary, 'Our returner programme.');
});

test('broken JSON-LD is ignored safely', () => {
  const s = extractPage('<title>T</title><script type="application/ld+json">{oops</script>', 'https://a.example/').suggestions;
  assert.equal(s[0].kind, 'basic');
});

test('diff reports added and removed sentences', () => {
  const d = diffText('Applications for the 2026 programme are now closed. Contact us for more information about returning.', 'Applications for the 2027 programme open on 3 February 2027. Contact us for more information about returning.');
  assert.deepEqual(d.added, ['Applications for the 2027 programme open on 3 February 2027.']);
  assert.deepEqual(d.removed, ['Applications for the 2026 programme are now closed.']);
});

test('date hints find dated sentences near application words only', () => {
  const h = dateHints('We were founded on 4 May 1990. The closing date for applications is 12 December 2026. Lunch is at noon.');
  assert.deepEqual(h, ['The closing date for applications is 12 December 2026.']);
});

test('robots.txt: longest rule wins and our own group takes priority', () => {
  const r = robotsRules('User-agent: *\nDisallow: /\n\nUser-agent: IFAFA-CareerHub\nDisallow: /private\nAllow: /private/careers\n');
  assert.equal(robotsAllows(r, '/careers'), true);
  assert.equal(robotsAllows(r, '/private/x'), false);
  assert.equal(robotsAllows(r, '/private/careers/returners'), true);
  const star = robotsRules('User-agent: *\nDisallow: /search\nDisallow: /*.pdf$\n');
  assert.equal(robotsAllows(star, '/search?q=1'), false);
  assert.equal(robotsAllows(star, '/doc.pdf'), false);
  assert.equal(robotsAllows(star, '/doc.pdf.html'), true);
  assert.equal(robotsAllows(robotsRules('User-agent: *\nDisallow:\n'), '/anything'), true);
});
