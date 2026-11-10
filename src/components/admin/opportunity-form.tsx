'use client';
import { useActionState, useState } from 'react';
import { saveOpportunity, type FormState } from '@/app/admin/actions';
import { CAREER_BREAK, PROGRAMME_TYPES, RECORDED_STATUSES, REGIONS, SECTORS, WORK_ARRANGEMENTS, type Opportunity } from '@/lib/types';
import { formatDate } from '@/lib/status';

type Values = Partial<Opportunity>;

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <span id={`${id}-err`} className="mt-1 block text-sm font-medium text-red-800">{msg}</span> : null;
}

type Prov = Partial<Record<string, string>>;
function From({ text }: { text?: string }) {
  return text ? <span className="mt-1 flex gap-1.5 text-xs text-upcoming"><span aria-hidden="true">↳</span><span><span className="font-semibold">From the source:</span> {text}</span></span> : null;
}

function Text({ name, label, v, errors, hint, required, textarea, rows = 4, max, type = 'text', placeholder, prov }:
  { name: keyof Opportunity; label: string; v: Values; errors?: FormState['errors']; hint?: string; required?: boolean; textarea?: boolean; rows?: number; max?: number; type?: string; placeholder?: string; prov?: Prov }) {
  const err = errors?.[name];
  const describedBy = [hint && `${name}-hint`, err && `${name}-err`].filter(Boolean).join(' ') || undefined;
  const common = { id: name, name, defaultValue: (v[name] as string) ?? '', required, maxLength: max, placeholder, 'aria-invalid': !!err || undefined, 'aria-describedby': describedBy, className: `field ${err ? 'border-red-400' : ''}` };
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}{!required && <span className="font-normal text-muted"> (optional)</span>}</label>
      {textarea ? <textarea {...common} rows={rows} /> : <input {...common} type={type} />}
      {hint && <span id={`${name}-hint`} className="field-hint">{hint}</span>}
      <From text={prov?.[name]} />
      <FieldError id={name} msg={err} />
    </div>
  );
}

function Choice({ name, label, options, v, errors, allowEmpty, prov }: { name: keyof Opportunity; label: string; options: Record<string, string>; v: Values; errors?: FormState['errors']; allowEmpty?: string; prov?: Prov }) {
  const err = errors?.[name];
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <select id={name} name={name} defaultValue={(v[name] as string) ?? ''} className={`field ${err ? 'border-red-400' : ''}`} aria-invalid={!!err || undefined} aria-describedby={err ? `${name}-err` : undefined} required={!allowEmpty}>
        <option value="">{allowEmpty ?? 'Choose…'}</option>
        {Object.entries(options).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
      <From text={prov?.[name]} />
      <FieldError id={name} msg={err} />
    </div>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-serif text-xl font-semibold" aria-hidden="true">{title}</h2>
      {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </fieldset>
  );
}

export function OpportunityForm({ initial, prefill, provenance, suggestionId }: { initial?: Opportunity; prefill?: Partial<Opportunity>; provenance?: Prov; suggestionId?: string }) {
  const [state, action, pending] = useActionState(saveOpportunity, {});
  // After a failed save, show exactly what the volunteer typed (React resets forms after an action).
  const sv = state.values;
  const v: Values = sv ? { ...initial, ...sv, dates_verified: sv.dates_verified === 'on', is_example: sv.is_example === 'on' } as Values : initial ?? { career_break: 'not-specified', work_arrangement: 'not-specified', ...prefill };
  return <FormBody key={state.seq ?? 0} v={v} state={state} action={action} pending={pending} initial={initial} prov={provenance} suggestionId={suggestionId} />;
}

function FormBody({ v, state, action, pending, initial, prov, suggestionId }: { v: Values; state: FormState; action: (fd: FormData) => void; pending: boolean; initial?: Opportunity; prov?: Prov; suggestionId?: string }) {
  const [datesVerified, setDatesVerified] = useState(!!v.dates_verified);
  const e = state.errors;

  return (
    <form action={action} className="space-y-6" noValidate>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {suggestionId && <input type="hidden" name="suggestion_id" value={suggestionId} />}
      {state.message && (
        <p role={state.ok ? 'status' : 'alert'} className={`rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? 'bg-open-bg text-open' : 'bg-red-50 text-red-800'}`}>{state.message}</p>
      )}

      <Section title="The opportunity" intro="Copy only what the official source says.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="employer" label="Employer or organisation" v={v} errors={e} required max={120} prov={prov} />
          <Text name="programme_name" label="Programme or role name" v={v} errors={e} required max={160} prov={prov} />
        </div>
        <Text name="summary" label="One-sentence summary" v={v} errors={e} required textarea rows={2} max={300} hint="Shown on directory cards. Up to 300 characters." prov={prov} />
        <Text name="description" label="Description" v={v} errors={e} required textarea rows={7} max={6000} hint="Leave a blank line between paragraphs. Plain text only." prov={prov} />
      </Section>

      <Section title="Details" intro="Leave a field empty if the source doesn’t say. The public page will show “Not confirmed” — never a guess.">
        <Text name="eligibility" label="Eligibility criteria" v={v} errors={e} textarea rows={4} max={3000} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="duration" label="Duration" v={v} errors={e} max={200} placeholder="e.g. 16 weeks" />
          <Text name="compensation" label="Compensation" v={v} errors={e} max={300} placeholder="Exactly as stated by the employer" prov={prov} />
        </div>
      </Section>

      <Section title="Classification" intro="Used by the directory filters.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Choice name="sector" label="Career sector" options={SECTORS} v={v} errors={e} />
          <Choice name="programme_type" label="Programme type" options={PROGRAMME_TYPES} v={v} errors={e} />
          <Text name="location" label="Location (as described)" v={v} errors={e} required max={120} placeholder="e.g. Dublin 2" prov={prov} />
          <Choice name="region" label="Location filter" options={REGIONS} v={v} errors={e} prov={prov} />
          <Choice name="work_arrangement" label="Working arrangement" options={WORK_ARRANGEMENTS} v={v} errors={e} prov={prov} />
          <Choice name="career_break" label="Career-break eligibility" options={CAREER_BREAK} v={v} errors={e} />
        </div>
      </Section>

      <Section title="Application" intro="Dates are published only when you have confirmed them at the official source.">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-stone p-4">
          <input type="checkbox" name="dates_verified" defaultChecked={!!v.dates_verified} onChange={ev => setDatesVerified(ev.target.checked)} className="mt-0.5 size-5 accent-[var(--color-forest)]" aria-describedby={e?.dates_verified ? 'dates_verified-err' : undefined} />
          <span><span className="font-semibold">I confirmed these dates at the official source</span><span className="block text-sm text-muted">If unticked, any dates are not saved, and the status comes from the option below.</span>
            <FieldError id="dates_verified" msg={e?.dates_verified} /></span>
        </label>
        <div className={`grid gap-5 sm:grid-cols-2 ${datesVerified ? '' : 'opacity-60'}`}>
          <Text name="opens_on" label="Applications open" type="date" v={v} errors={e} />
          <Text name="closes_on" label="Applications close" type="date" v={v} errors={e} prov={prov} />
        </div>
        {!datesVerified && (
          <Choice name="recorded_status" label="Status at the source (when no dates are confirmed)" options={RECORDED_STATUSES} v={v} errors={e} allowEmpty="Couldn’t tell — show as unverified" />
        )}
        <Text name="application_url" label="Official application link" type="url" v={v} errors={e} max={2000} placeholder="https://" hint="Leave empty if there is no direct application page; visitors will be sent to the source instead." prov={prov} />
      </Section>

      <Section title="Verification">
        <Text name="source_url" label="Source URL" type="url" v={v} errors={e} required max={2000} placeholder="https://" hint="The official page where you checked these details." prov={prov} />
        <p className="text-sm text-ink-soft">{v.last_verified_on ? <>Last verified on <strong>{formatDate(v.last_verified_on)}</strong>.</> : 'This listing has never been verified.'}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-mint p-4">
          <input type="checkbox" name="verified_today" className="mt-0.5 size-5 accent-[var(--color-forest)]" />
          <span><span className="font-semibold">I checked every detail above against the source today</span><span className="block text-sm text-muted">Sets the “last verified” date to today. Only tick this if you have just checked.</span></span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="is_example" defaultChecked={!!v.is_example} className="size-5 accent-[var(--color-forest)]" />
          This is an example listing (shown with an “Example” label)
        </label>
      </Section>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-3 border-t border-line bg-stone/95 px-5 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <button name="intent" value="save" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : initial ? 'Save changes' : 'Save as draft'}</button>
        {initial?.publication !== 'published' && <button name="intent" value="publish" className="btn-secondary" disabled={pending}>Save and publish</button>}
      </div>
    </form>
  );
}
