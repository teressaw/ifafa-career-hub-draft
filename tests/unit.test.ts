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
