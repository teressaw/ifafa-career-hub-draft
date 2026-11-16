import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For employers',
  description: 'What a structured return-to-work pathway is, why it works, and a free builder that turns your choices into a practical starting plan.',
};

const PARTS = [
  ['A real role', 'Work that needs doing, in a team, at the person’s level.'],
  ['A defined period of support', 'Typically 12 to 24 weeks: a buddy, check-ins, refresher training.'],
  ['Hiring that doesn’t screen on dates', 'A route in that isn’t closed by a CV with years outside paid work.'],
  ['A prepared manager', 'Briefed before the first day on what to expect and what not to assume.'],
  ['An honest ending', 'An ongoing role where possible, and a clear answer either way, in good time.'],
] as const;

export default function Employers() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">For employers</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-olive sm:text-5xl">Experienced people are easier to find than your hiring process suggests.</h1>
        <p className="mt-4 text-lg text-ink-soft">Many capable people are filtered out for one reason: the dates on their CV. A return-to-work pathway is a deliberate way to hire them, with enough structure that it works for both sides.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/employers/pathway-builder" className="btn-primary min-h-12 px-6 text-base">Build a pathway</Link>
          <Link href="/returnships" className="btn-secondary min-h-12 px-6 text-base">What candidates look for</Link>
        </div>
      </header>

      <section aria-labelledby="parts-h" className="mt-14">
        <h2 id="parts-h" className="font-serif text-2xl font-semibold text-olive sm:text-3xl">What a pathway is made of</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">It can be a cohort programme in a large firm or one well-supported hire in a small one. The parts are the same.</p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTS.map(([h, p], n) => (
            <li key={h} className="card p-5"><span aria-hidden="true" className="font-serif text-xl font-semibold text-rust">{n + 1}</span><h3 className="mt-1 font-semibold text-ink">{h}</h3><p className="mt-1 text-sm text-ink-soft">{p}</p></li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="builder-h" className="mt-14 grid gap-8 rounded-[14px] border border-line bg-paper p-6 sm:p-9 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 id="builder-h" className="font-serif text-2xl font-semibold text-olive sm:text-3xl">The pathway builder</h2>
          <p className="mt-3 text-ink-soft">Seven short steps: aims, eligibility, roles, shape, hiring, support, pay. About ten minutes.</p>
          <p className="mt-3 text-ink-soft">You get a starting plan you can copy, download or print: draft eligibility wording, a hiring process, a support plan, a dated sequence, and the choices we think are worth a second look.</p>
          <Link href="/employers/pathway-builder" className="btn-primary mt-5">Start the builder →</Link>
        </div>
        <ul className="space-y-3 text-sm text-ink-soft">
          <li><strong className="text-ink">Free, no account.</strong> Your answers stay in your browser.</li>
          <li><strong className="text-ink">Rule-based, not AI-written.</strong> The same answers always give the same plan.</li>
          <li><strong className="text-ink">A starting point, not legal advice.</strong> Check contracts and pay with your HR lead or an employment-law adviser.</li>
        </ul>
      </section>

      <section aria-labelledby="list-h" className="mt-14 max-w-3xl">
        <h2 id="list-h" className="font-serif text-2xl font-semibold text-olive">Listing a programme on Workbreak</h2>
        <p className="mt-3 text-ink-soft">Listings are free while we’re getting started. We check each one against your own published page before it appears, show the date we last checked, and mark anything you haven’t stated as “not confirmed”. We don’t accept payment for placement.</p>
        <p className="mt-3 text-ink-soft">The builder’s final step lists the details candidates look for. Publishing those on your own careers page is the best way to be listed accurately.</p>
      </section>
    </div>
  );
}
