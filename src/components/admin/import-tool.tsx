'use client';
import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { importFromUrl, type ImportState } from '@/app/admin/actions';
import { OpportunityForm } from '@/components/admin/opportunity-form';
import type { Opportunity } from '@/lib/types';

export function ImportTool({ initialUrl = '' }: { initialUrl?: string }) {
  const [state, act, pending] = useActionState(importFromUrl, {} as ImportState);
  const [pick, setPick] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const ran = useRef(false);

  // A link from the Watched sources page (?url=…) runs straight away.
  useEffect(() => {
    if (initialUrl && !ran.current && form.current) { ran.current = true; const fd = new FormData(form.current); startTransition(() => act(fd)); }
  }, [initialUrl, act]);

  const s = state.suggestions?.[Math.min(pick, (state.suggestions?.length ?? 1) - 1)];
  const prefill = s ? ({ source_url: state.url, ...s.fields } as Partial<Opportunity>) : undefined;
  const provenance = s ? { source_url: 'the page you imported', ...s.provenance } : undefined;

  return (
    <div className="space-y-8">
      <form ref={form} action={act} className="card p-5 sm:p-6">
        <label htmlFor="url" className="field-label">Page address</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="url" name="url" type="url" required defaultValue={state.url ?? initialUrl} placeholder="https://…" className="field" aria-describedby="url-hint" />
          <button className="btn-primary shrink-0" disabled={pending}>{pending ? 'Reading the page…' : 'Read page'}</button>
        </div>
        <span id="url-hint" className="field-hint">Use the employer’s own page where possible. The hub respects each site’s robots.txt rules.</span>
        {state.message && <p role="status" className={`mt-3 rounded-xl px-4 py-3 text-sm ${state.ok ? 'bg-open-bg text-open' : 'bg-red-50 text-red-800'}`}>{state.message}</p>}
      </form>

      {state.ok && s && (
        <section aria-labelledby="draft-h">
          <h2 id="draft-h" className="font-serif text-2xl font-semibold">Draft from “{state.title || state.url}”</h2>
          {(state.suggestions?.length ?? 0) > 1 && (
            <div className="mt-3">
              <label htmlFor="pick" className="field-label">This page lists {state.suggestions!.length} postings — choose one</label>
              <select id="pick" className="field" value={pick} onChange={e => setPick(Number(e.target.value))}>
                {state.suggestions!.map((x, i) => <option key={i} value={i}>{x.fields.programme_name ?? `Posting ${i + 1}`}</option>)}
              </select>
            </div>
          )}
          {state.dateHints && state.dateHints.length > 0 && (
            <div className="mt-4 rounded-xl border border-upcoming/30 bg-upcoming-bg p-4 text-sm">
              <p className="font-semibold text-upcoming">Sentences on the page that mention dates</p>
              <p className="text-xs text-muted">Hints only — confirm on the page before entering any date.</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">{state.dateHints.map(h => <li key={h}>{h}</li>)}</ul>
            </div>
          )}
          <p className="mt-4 text-sm text-ink-soft">Fields marked <span className="font-semibold text-upcoming">“From the source”</span> were filled in from the page. Everything else is empty because the page didn’t say — please don’t guess.</p>
          <div className="mt-6"><OpportunityForm key={`${state.url}-${pick}`} prefill={prefill} provenance={provenance} /></div>
        </section>
      )}
    </div>
  );
}
