'use client';
import { useActionState, useState } from 'react';
import { resourceAction, saveResource, type ResourceFormState } from '@/app/admin/resource-actions';
import { AUDIENCES, COSTS, FORMATS, RESOURCE_KINDS, type Resource, type ResourceKind } from '@/lib/resources';
import { formatDate } from '@/lib/status';

type V = Record<string, string | string[] | boolean | null | undefined>;
const s = (v: V, k: string) => (typeof v[k] === 'string' ? (v[k] as string) : '');

function Err({ id, msg }: { id: string; msg?: string }) { return msg ? <span id={`${id}-err`} className="mt-1 block text-sm font-medium text-red-800">{msg}</span> : null; }

function Field({ name, label, v, e, hint, textarea, type = 'text', required, max }: { name: string; label: string; v: V; e?: ResourceFormState['errors']; hint?: string; textarea?: boolean; type?: string; required?: boolean; max?: number }) {
  const err = e?.[name];
  const p = { id: `r-${name}`, name, defaultValue: s(v, name), required, maxLength: max, 'aria-invalid': !!err || undefined, 'aria-describedby': [hint && `r-${name}-hint`, err && `${name}-err`].filter(Boolean).join(' ') || undefined, className: `field ${err ? 'border-red-400' : ''}` };
  return (
    <div>
      <label htmlFor={`r-${name}`} className="field-label">{label}{!required && <span className="font-normal text-muted"> (optional)</span>}</label>
      {textarea ? <textarea {...p} rows={4} /> : <input {...p} type={type} />}
      {hint && <span id={`r-${name}-hint`} className="field-hint">{hint}</span>}
      <Err id={name} msg={err} />
    </div>
  );
}

function Pick({ name, label, options, v, e }: { name: string; label: string; options: Record<string, string>; v: V; e?: ResourceFormState['errors'] }) {
  return (
    <div>
      <label htmlFor={`r-${name}`} className="field-label">{label}</label>
      <select id={`r-${name}`} name={name} defaultValue={s(v, name)} className="field">{Object.entries(options).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
      <Err id={name} msg={e?.[name]} />
    </div>
  );
}

export function ResourceForm({ initial, kind }: { initial?: Resource; kind?: ResourceKind }) {
  const [state, action, pending] = useActionState(saveResource, {} as ResourceFormState);
  const sv = state.values;
  const v: V = sv ? { ...initial, ...sv, date_verified: sv.date_verified === 'on' } as V
    : (initial as unknown as V) ?? { kind: kind ?? 'support', cost: 'not-stated', format: 'not-stated', audiences: [] };
  return <Body key={state.seq ?? 0} v={v} state={state} action={action} pending={pending} initial={initial} />;
}

function Body({ v, state, action, pending, initial }: { v: V; state: ResourceFormState; action: (fd: FormData) => void; pending: boolean; initial?: Resource }) {
  const [kind, setKind] = useState(s(v, 'kind') || 'support');
  const [dated, setDated] = useState(!!v.date_verified);
  const e = state.errors;
  const aud = Array.isArray(v.audiences) ? v.audiences : [];
  return (
    <form action={action} className="space-y-6" noValidate>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {state.message && <p role={state.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 text-sm ${state.ok ? 'bg-open-bg text-open' : 'bg-red-50 text-red-800'}`}>{state.message}</p>}
      <fieldset className="card space-y-5 p-5 sm:p-7">
        <legend className="sr-only">Details</legend>
        <div>
          <label htmlFor="r-kind" className="field-label">What is it?</label>
          <select id="r-kind" name="kind" value={kind} onChange={ev => setKind(ev.target.value)} className="field">{Object.entries(RESOURCE_KINDS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select>
        </div>
        <Field name="title" label="Title" v={v} e={e} required max={160} />
        <Field name="provider" label="Provided by" v={v} e={e} required max={120} hint="The organisation running it, e.g. a government department, university or professional body." />
        <Field name="summary" label="Summary" v={v} e={e} required textarea max={400} hint="One or two sentences, in your own words, from what the source says." />
        <Field name="details" label="More details" v={v} e={e} textarea max={4000} />
        <Field name="url" label="Official link" type="url" v={v} e={e} required max={2000} hint="Where visitors go to register, book or read more. Use the provider’s own page." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Pick name="cost" label="Cost" options={COSTS} v={v} e={e} />
          <Pick name="format" label="Format" options={FORMATS} v={v} e={e} />
        </div>
        <Field name="location" label="Location" v={v} e={e} max={120} hint="For in-person items, e.g. Dublin 2." />
        <fieldset>
          <legend className="field-label">Most useful for</legend>
          <p className="field-hint mb-2">Tick the homepage paths this helps. Leave all unticked if it is useful to everyone.</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(AUDIENCES).map(([k, t]) => (
              <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-stone px-3 text-sm"><input type="checkbox" name="audiences" value={k} defaultChecked={aud.includes(k)} className="size-5 accent-[var(--color-forest)]" />{t}</label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {kind === 'event' && (
        <fieldset className="card space-y-5 p-5 sm:p-7">
          <legend className="sr-only">Event date</legend>
          <h2 className="font-serif text-xl font-semibold" aria-hidden="true">Event date</h2>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-stone p-4">
            <input type="checkbox" name="date_verified" defaultChecked={dated} onChange={ev => setDated(ev.target.checked)} className="mt-0.5 size-5 accent-[var(--color-forest)]" />
            <span><span className="font-semibold">I confirmed the date on the organiser’s page</span><span className="block text-sm text-muted">If unticked, no date is saved and visitors see “Date to be confirmed”.</span></span>
          </label>
          {dated && <div className="grid gap-5 sm:grid-cols-2"><Field name="event_date" label="Date" type="date" v={v} e={e} required /><Field name="event_time" label="Time" v={v} e={e} max={60} hint="As stated, e.g. 12:30–13:30 Irish time" /></div>}
        </fieldset>
      )}

      <fieldset className="card space-y-4 p-5 sm:p-7">
        <legend className="sr-only">Verification</legend>
        <p className="text-sm text-ink-soft">{initial?.last_verified_on ? <>Last checked on <strong>{formatDate(initial.last_verified_on)}</strong>.</> : 'Not checked yet.'}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-mint p-4">
          <input type="checkbox" name="verified_today" className="mt-0.5 size-5 accent-[var(--color-forest)]" />
          <span className="font-semibold">I checked these details against the official link today</span>
        </label>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button name="intent" value="save" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : initial ? 'Save changes' : 'Save as draft'}</button>
        {initial?.publication !== 'published' && <button name="intent" value="publish" className="btn-secondary" disabled={pending}>Save and publish</button>}
      </div>
    </form>
  );
}

export function ResourceControls({ r, isAdmin }: { r: Resource; isAdmin: boolean }) {
  const [state, act, pending] = useActionState(resourceAction, {} as ResourceFormState);
  const btn = (what: string, text: string, cls = 'btn-secondary') => <button name="do" value={what} className={`${cls} min-h-10`} disabled={pending}>{text}</button>;
  return (
    <div className="space-y-3">
      <form action={act} className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={r.id} />
        {r.publication !== 'published' && btn('publish', 'Publish', 'btn-primary')}
        {r.publication === 'published' && btn('unpublish', 'Unpublish')}
        {r.publication !== 'archived' && btn('archive', 'Archive')}
      </form>
      {isAdmin && (
        <form action={act} className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
          <input type="hidden" name="id" value={r.id} />
          <div><label htmlFor="confirm-del" className="field-label text-xs">Type DELETE to delete permanently</label><input id="confirm-del" name="confirm" className="field min-h-10 w-36" autoComplete="off" /></div>
          {btn('delete', 'Delete', 'btn-danger')}
        </form>
      )}
      {state.message && <p role="status" className={`text-sm ${state.ok ? 'text-open' : 'text-red-800'}`}>{state.message}</p>}
    </div>
  );
}
