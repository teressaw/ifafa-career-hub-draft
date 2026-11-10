'use client';
import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { addSource, checkSource, sourceAction, type FormState, type SourceCheckState } from '@/app/admin/actions';
import { SOURCE_KINDS, SOURCE_STATUS_LABEL, type Source, type SourceStatus } from '@/lib/monitor/sources';

const STATUS_STYLE: Record<SourceStatus, string> = {
  'not-checked': 'bg-stone-2 text-ink-soft', unchanged: 'bg-open-bg text-open', changed: 'bg-unverified-bg text-unverified', error: 'bg-red-50 text-red-800', blocked: 'bg-closed-bg text-closed',
};
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Dublin' }) : '');

function Status({ s }: { s: SourceStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[s]}`}>{SOURCE_STATUS_LABEL[s]}</span>;
}

function SourceRow({ src, live, result, onCheck, checking }: { src: Source; live: boolean; result?: SourceCheckState; onCheck: () => void; checking: boolean }) {
  const r = result?.result;
  const status: SourceStatus = r?.status ?? src.last_status;
  const change = r?.change ?? src.last_change;
  const [state, act, pending] = useActionState(sourceAction, {} as FormState);
  const found = r?.suggestions?.length ?? 0;
  return (
    <li className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><Status s={status} /><span className="text-xs font-medium text-muted">{SOURCE_KINDS[src.kind]}</span>{!src.active && <span className="text-xs font-semibold text-muted">· Paused</span>}</div>
          <h3 className="mt-2 font-semibold text-ink">{src.name}</h3>
          <a href={src.url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-forest underline underline-offset-2">{src.url.replace(/^https?:\/\//, '')}</a>
          {src.notes && <p className="mt-1 text-sm text-muted">{src.notes}</p>}
          <p className="mt-1 text-xs text-muted">
            {r ? `Checked just now` : src.last_checked_at ? `Last checked ${fmt(src.last_checked_at)}` : 'Not checked yet'}
            {live && ` · every ${src.check_every_days} day${src.check_every_days === 1 ? '' : 's'}`}
            {src.last_changed_at && !r && ` · last change ${fmt(src.last_changed_at)}`}
          </p>
        </div>
        <button onClick={onCheck} disabled={checking} className="btn-secondary min-h-10 shrink-0">{checking ? 'Checking…' : 'Check now'}</button>
      </div>

      {(result?.message || (src.last_error && !r)) && (
        <p role="status" className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${status === 'error' ? 'bg-red-50 text-red-800' : status === 'blocked' ? 'bg-closed-bg text-ink' : 'bg-stone text-ink-soft'}`}>{result?.message ?? src.last_error}</p>
      )}
      {change && (change.added.length > 0 || change.removed.length > 0 || change.dateHints.length > 0) && (
        <details className="mt-3 rounded-xl border border-line bg-white" open={status === 'changed'}>
          <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm font-semibold">What’s on the page{status === 'changed' ? ' — what changed' : ''}</summary>
          <div className="space-y-3 border-t border-line px-4 py-3 text-sm">
            {change.dateHints.length > 0 && <div><p className="font-semibold text-ink">Sentences mentioning dates <span className="font-normal text-muted">(hints only — confirm on the page)</span></p><ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">{change.dateHints.map((h, i) => <li key={i}>“{h}”</li>)}</ul></div>}
            {change.added.length > 0 && <div><p className="font-semibold text-open">New on the page</p><ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">{change.added.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
            {change.removed.length > 0 && <div><p className="font-semibold text-closed">No longer on the page</p><ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">{change.removed.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
          </div>
        </details>
      )}
      {found > 0 && (
        <p className="mt-3 text-sm"><strong>{found} job posting{found === 1 ? '' : 's'}</strong> with structured details found. {live ? <Link href="/admin/inbox" className="font-semibold text-forest underline">Review in the inbox</Link> : <Link href={`/admin/import?url=${encodeURIComponent(src.url)}`} className="font-semibold text-forest underline">See the pre-filled draft</Link>}</p>
      )}

      {live && (
        <form action={act} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={src.id} />
          {status === 'changed' && <button name="do" value="reviewed" className="btn-primary min-h-9 px-4" disabled={pending}>Mark as reviewed</button>}
          <button name="do" value={src.active ? 'pause' : 'resume'} className="btn-ghost min-h-9 px-3" disabled={pending}>{src.active ? 'Pause checks' : 'Resume checks'}</button>
          <button name="do" value="remove" className="btn-ghost min-h-9 px-3 text-red-800" disabled={pending}>Remove</button>
          {state.message && <span role="status" className="self-center text-sm text-muted">{state.message}</span>}
        </form>
      )}
    </li>
  );
}

export function SourcesBoard({ sources, live }: { sources: Source[]; live: boolean }) {
  const [results, setResults] = useState<Record<string, SourceCheckState>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [all, setAll] = useState<{ done: number; total: number } | null>(null);
  const [, start] = useTransition();

  async function runOne(id: string) {
    setChecking(id);
    const fd = new FormData(); fd.set('id', id);
    try { const r = await checkSource({}, fd); setResults(prev => ({ ...prev, [id]: r })); }
    catch { setResults(prev => ({ ...prev, [id]: { message: 'Something went wrong while checking. Please try again.' } })); }
    setChecking(null);
  }
  function runAll() {
    start(async () => {
      const list = sources.filter(s => s.active);
      setAll({ done: 0, total: list.length });
      // One at a time, with a short pause — gentle on the websites being checked.
      for (let i = 0; i < list.length; i++) { await runOne(list[i].id); setAll({ done: i + 1, total: list.length }); await new Promise(r => setTimeout(r, 400)); }
    });
  }
  const tally = Object.values(results).reduce((t, r) => { const s = r.result?.status; if (s) t[s] = (t[s] ?? 0) + 1; return t; }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={runAll} disabled={!!checking} className="btn-primary">{all && all.done < all.total ? `Checking ${all.done + 1} of ${all.total}…` : 'Check all sources now'}</button>
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {all && all.done === all.total ? `Done: ${tally.unchanged ?? 0} fine, ${tally.changed ?? 0} changed, ${(tally.error ?? 0) + (tally.blocked ?? 0)} to check by hand.` : live ? 'Sources are also checked automatically every day.' : 'Each check reads the real page live. Nothing is saved in the demo.'}
        </p>
      </div>
      {sources.length ? (
        <ul className="card mt-5 divide-y divide-line">{sources.map(s => <SourceRow key={s.id} src={s} live={live} result={results[s.id]} checking={checking === s.id} onCheck={() => runOne(s.id)} />)}</ul>
      ) : (
        <p className="card mt-5 p-6 text-sm text-muted">No sources yet. Add the first official page below.</p>
      )}
    </div>
  );
}

export function AddSourceForm() {
  const [state, act, pending] = useActionState(addSource, {} as FormState);
  const e = state.errors ?? {};
  return (
    <form action={act} key={state.seq} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-semibold">Watch another page</h2>
      {state.message && <p role={state.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-2.5 text-sm ${state.ok ? 'bg-open-bg text-open' : 'bg-red-50 text-red-800'}`}>{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="s-name" className="field-label">Name</label><input id="s-name" name="name" className="field" placeholder="e.g. Acme — Returners Programme" />{e.name && <span className="mt-1 block text-sm text-red-800">{e.name}</span>}</div>
        <div><label htmlFor="s-url" className="field-label">Official page</label><input id="s-url" name="url" type="url" className="field" placeholder="https://" />{e.url && <span className="mt-1 block text-sm text-red-800">{e.url}</span>}</div>
        <div><label htmlFor="s-kind" className="field-label">Kind of page</label><select id="s-kind" name="kind" className="field" defaultValue="programme-page">{Object.entries(SOURCE_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label htmlFor="s-days" className="field-label">Check every</label><select id="s-days" name="check_every_days" className="field" defaultValue="7">{[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>{d} day{d === 1 ? '' : 's'}</option>)}</select></div>
      </div>
      <div><label htmlFor="s-notes" className="field-label">Notes <span className="font-normal text-muted">(optional)</span></label><input id="s-notes" name="notes" className="field" maxLength={500} placeholder="e.g. Opens each spring" /></div>
      <button className="btn-primary" disabled={pending}>{pending ? 'Adding…' : 'Start watching'}</button>
    </form>
  );
}
