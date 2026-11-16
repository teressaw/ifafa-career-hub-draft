'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  APPLY, ASSESS, DEFAULT_INPUT, FORMATS, GOALS, HOURS, LENGTHS, LEVELS, MEASURES, PAY, PLACES, PLACE_OF_WORK, REASONS, SIZES, SUPPORTS, TIME_AWAY, VACANCY,
  buildPlan, planToText, sanitiseInput, type PathwayInput,
} from '@/lib/pathway';

const KEY = 'workbreak.pathway.v1';
const STEPS = ['Why', 'Who', 'Roles', 'Shape', 'Hiring', 'Support', 'Pay and measures', 'Your plan'] as const;

function Radios<K extends string>({ legend, hint, name, options, value, onChange }: { legend: string; hint?: string; name: string; options: Record<K, string>; value: K; onChange: (v: K) => void }) {
  return (
    <fieldset className="mt-6">
      <legend className="font-semibold text-ink">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-2 grid gap-2">
        {(Object.keys(options) as K[]).map(k => (
          <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2 has-[:checked]:border-olive has-[:checked]:bg-sage-soft">
            <input type="radio" name={name} value={k} checked={value === k} onChange={() => onChange(k)} className="size-4 accent-[#3a4626]" />
            <span>{options[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Checks<K extends string>({ legend, hint, name, options, value, onChange }: { legend: string; hint?: string; name: string; options: Record<K, string>; value: K[]; onChange: (v: K[]) => void }) {
  return (
    <fieldset className="mt-6">
      <legend className="font-semibold text-ink">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(Object.keys(options) as K[]).map(k => (
          <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2 has-[:checked]:border-olive has-[:checked]:bg-sage-soft">
            <input type="checkbox" name={name} value={k} checked={value.includes(k)} onChange={e => onChange(e.target.checked ? [...value, k] : value.filter(x => x !== k))} className="size-4 accent-[#3a4626]" />
            <span>{options[k]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function YesNo({ legend, hint, name, value, onChange }: { legend: string; hint?: string; name: string; value: boolean; onChange: (v: boolean) => void }) {
  return <Radios legend={legend} hint={hint} name={name} options={{ yes: 'Yes', no: 'Not yet' }} value={value ? 'yes' : 'no'} onChange={v => onChange(v === 'yes')} />;
}

export function PathwayBuilder() {
  const [input, setInput] = useState<PathwayInput>(DEFAULT_INPUT);
  const [step, setStep] = useState(0);
  const [restored, setRestored] = useState(false);
  const [note, setNote] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Restore saved answers from this browser, once.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off restore from browser storage after hydration
      if (raw) { setInput(sanitiseInput(JSON.parse(raw))); setRestored(true); }
    } catch { /* storage unavailable: carry on without saving */ }
  }, []);
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step]);

  const set = <K extends keyof PathwayInput>(k: K, v: PathwayInput[K]) => {
    const next = { ...input, [k]: v };
    setInput(next);
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const go = (n: number) => { moved.current = true; setNote(''); setStep(Math.max(0, Math.min(STEPS.length - 1, n))); };
  const plan = useMemo(() => buildPlan(input), [input]);
  const last = step === STEPS.length - 1;

  const copy = async () => {
    try { await navigator.clipboard.writeText(planToText(plan)); setNote('Plan copied. Paste it into an email or document.'); }
    catch { setNote('Copying is blocked in this browser. Use “Download as text” instead.'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([planToText(plan)], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'workbreak-pathway-plan.txt'; a.click(); URL.revokeObjectURL(url);
    setNote('Plan downloaded.');
  };
  const reset = () => { setInput(DEFAULT_INPUT); try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } setRestored(false); go(0); };

  return (
    <div>
      <nav aria-label="Steps" className="no-print">
        <ol className="flex flex-wrap gap-1.5 text-sm">
          {STEPS.map((s, n) => (
            <li key={s}>
              <button type="button" onClick={() => go(n)} aria-current={n === step ? 'step' : undefined}
                className={`min-h-10 rounded-full border px-3.5 font-semibold ${n === step ? 'border-olive bg-olive text-paper' : 'border-line bg-paper text-ink-soft hover:border-olive'}`}>
                <span className="sr-only">Step </span>{n + 1}<span className="hidden sm:inline">. {s}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {restored && step === 0 && <p className="no-print mt-4 rounded-xl bg-blue-soft px-4 py-3 text-sm text-ink-soft">We’ve restored the answers saved in this browser. <button type="button" onClick={reset} className="font-semibold underline">Start again</button></p>}

      <div className="mt-6">
        <h2 ref={heading} tabIndex={-1} className="font-serif text-2xl font-semibold text-olive outline-none sm:text-3xl">
          <span className="no-print text-base font-sans font-semibold text-muted">Step {step + 1} of {STEPS.length} · </span>{last ? plan.title : STEPS[step]}
        </h2>

        {step === 0 && <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="pb-org" className="field-label">Organisation name <span className="font-normal text-muted">(optional)</span></label><input id="pb-org" className="field" maxLength={80} value={input.organisation} onChange={e => set('organisation', e.target.value)} autoComplete="organization" /></div>
            <div><label htmlFor="pb-roles" className="field-label">Roles or teams you have in mind <span className="font-normal text-muted">(optional)</span></label><input id="pb-roles" className="field" maxLength={200} value={input.roles} onChange={e => set('roles', e.target.value)} placeholder="e.g. finance, software engineering" /></div>
          </div>
          <Checks legend="What do you want this pathway to achieve?" hint="Choose one or two. They decide what success means." name="goals" options={GOALS} value={input.goals} onChange={v => set('goals', v)} />
          <Radios legend="How big is the organisation?" name="size" options={SIZES} value={input.size} onChange={v => set('size', v)} />
          <YesNo legend="Is there a senior sponsor who owns the headcount?" name="sponsor" value={input.sponsor} onChange={v => set('sponsor', v)} />
        </>}
        {step === 1 && <>
          <Radios legend="How many places, to begin with?" name="places" options={PLACES} value={input.places} onChange={v => set('places', v)} />
          <Radios legend="Minimum time away from paid work in the field" name="timeAway" options={TIME_AWAY} value={input.timeAway} onChange={v => set('timeAway', v)} />
          <Radios legend="Reasons for the time away" hint="People step away for many reasons. Asking them to prove one is rarely necessary." name="reasons" options={REASONS} value={input.reasons} onChange={v => set('reasons', v)} />
          <Radios legend="Level of experience" name="level" options={LEVELS} value={input.level} onChange={v => set('level', v)} />
        </>}
        {step === 2 && <>
          <Radios legend="Is there a real role behind each place?" hint="The single biggest factor in whether a returnship is worth someone’s time." name="vacancy" options={VACANCY} value={input.vacancy} onChange={v => set('vacancy', v)} />
          <Radios legend="Hours" name="hours" options={HOURS} value={input.hours} onChange={v => set('hours', v)} />
          <Radios legend="Place of work" name="place" options={PLACE_OF_WORK} value={input.place} onChange={v => set('place', v)} />
        </>}
        {step === 3 && <>
          <Radios legend="Format" name="format" options={FORMATS} value={input.format} onChange={v => set('format', v)} />
          <Radios legend={input.format === 'returnship' ? 'Length of the programme' : 'Length of the support period'} name="length" options={LENGTHS} value={input.length} onChange={v => set('length', v)} />
          <div className="mt-6 max-w-xs"><label htmlFor="pb-start" className="field-label">Intended start month <span className="font-normal text-muted">(optional)</span></label><input id="pb-start" type="month" className="field" value={input.start} onChange={e => set('start', e.target.value)} /><span className="field-hint">Used to date the sequence in your plan.</span></div>
        </>}
        {step === 4 && <>
          <Radios legend="How will people apply?" name="apply" options={APPLY} value={input.apply} onChange={v => set('apply', v)} />
          <Checks legend="How will you assess?" name="assess" options={ASSESS} value={input.assess} onChange={v => set('assess', v)} />
        </>}
        {step === 5 && <>
          <Checks legend="What support will each person have?" name="supports" options={SUPPORTS} value={input.supports} onChange={v => set('supports', v)} />
          <YesNo legend="Will line managers be briefed before the first day?" name="managerBriefing" value={input.managerBriefing} onChange={v => set('managerBriefing', v)} />
        </>}
        {step === 6 && <>
          <Radios legend="Pay" name="pay" options={PAY} value={input.pay} onChange={v => set('pay', v)} />
          <Checks legend="What will you measure?" name="measures" options={MEASURES} value={input.measures} onChange={v => set('measures', v)} />
        </>}

        {last && (
          <div className="plan mt-4">
            <p className="text-lg text-ink-soft">{plan.summary}</p>
            <div className="no-print mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="btn-primary">Copy plan</button>
              <button type="button" onClick={download} className="btn-secondary">Download as text</button>
              <button type="button" onClick={() => window.print()} className="btn-secondary">Print or save as PDF</button>
            </div>
            <p role="status" aria-live="polite" className="no-print mt-2 min-h-5 text-sm text-sage-deep">{note}</p>

            {plan.reconsider.length > 0 && (
              <section aria-labelledby="pl-reconsider" className="mt-6 rounded-2xl border border-mustard/60 bg-mustard-soft px-5 py-4">
                <h3 id="pl-reconsider" className="font-serif text-xl font-semibold text-ink">Worth a second look</h3>
                <dl className="mt-2 space-y-3">
                  {plan.reconsider.map(r => <div key={r.title}><dt className="font-semibold">{r.title}</dt><dd className="text-ink-soft">{r.why}</dd></div>)}
                </dl>
              </section>
            )}
            {plan.sections.map(s => (
              <section key={s.id} aria-labelledby={`pl-${s.id}`} className="mt-8">
                <h3 id={`pl-${s.id}`} className="font-serif text-xl font-semibold text-olive">{s.title}</h3>
                {s.intro && <p className="mt-1 text-sm text-muted">{s.intro}</p>}
                <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft marker:text-rust">{s.points.map((p, n) => <li key={n}>{p}</li>)}</ul>
              </section>
            ))}
            <section aria-labelledby="pl-seq" className="mt-8">
              <h3 id="pl-seq" className="font-serif text-xl font-semibold text-olive">Sequence</h3>
              <ol className="mt-3 space-y-2">
                {plan.timeline.map((t, n) => <li key={n} className="grid gap-x-4 border-b border-line pb-2 sm:grid-cols-[190px_1fr]"><span className="font-semibold text-ink">{t.when}</span><span className="text-ink-soft">{t.what}</span></li>)}
              </ol>
            </section>
            <section aria-labelledby="pl-listing" className="mt-8">
              <h3 id="pl-listing" className="font-serif text-xl font-semibold text-olive">What candidates will want to know</h3>
              <p className="mt-1 text-sm text-muted">These are the details Workbreak shows on every listing. Gaps here become “Not confirmed” there.</p>
              <dl className="card mt-3 px-5">
                {plan.listing.map(l => <div key={l.label} className="border-b border-line py-3 last:border-0 sm:grid sm:grid-cols-[210px_1fr] sm:gap-4"><dt className="text-sm font-semibold text-muted">{l.label}</dt><dd>{l.value}</dd></div>)}
              </dl>
            </section>
            <p className="mt-8 rounded-xl border border-line bg-stone-2 px-4 py-3 text-sm text-ink-soft">{plan.caveat}</p>
          </div>
        )}
      </div>

      <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn-secondary">← Back</button>
        {last ? <button type="button" onClick={reset} className="btn-ghost">Start again</button> : <button type="button" onClick={() => go(step + 1)} className="btn-primary">{step === STEPS.length - 2 ? 'See your plan →' : 'Next →'}</button>}
      </div>
      <p className="no-print mt-4 text-sm text-muted">Your answers stay in this browser. Nothing is sent to Workbreak or stored on our servers.</p>
    </div>
  );
}
