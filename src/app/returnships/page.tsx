import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Returnships, explained',
  description: 'What a returnship is, how it differs from other routes back into paid work, and what to check before you apply.',
};

const KINDS = [
  ['Returnship', 'A paid, fixed-length placement (often 12 to 24 weeks) for people coming back after time away, with support and usually the prospect of an ongoing role.'],
  ['Re-entry programme', 'A structured programme run by a training body, college or network: training, mentoring or coaching, sometimes with a work placement.'],
  ['Returner-friendly role', 'An ordinary job whose employer says in writing that time away from paid work is welcome. No programme around it.'],
  ['Training and mentoring', 'Courses and mentoring aimed at people returning. Useful, but not a job.'],
] as const;

const CHECKS = [
  ['Is it paid, and how much?', 'Look for a salary or range. “Competitive” tells you nothing. A returnship is work and should be paid as work.'],
  ['What happens at the end?', 'Ask how many people from the last intake were offered ongoing roles, and whether there is a role behind your place.'],
  ['Who is it for?', 'Good programmes set a minimum time away and leave it there. Be wary of any that ask you to justify the reason.'],
  ['What are the hours?', 'If part-time or flexible working matters to you, it should be stated, not left to negotiate once you’ve proven yourself.'],
  ['What support is there?', 'A named buddy or mentor, check-ins, refresher training. “A supportive environment” is not support.'],
  ['Who will you work for?', 'Ask whether your manager has taken part before, or been briefed. They decide what your weeks are like.'],
] as const;

export default function Returnships() {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">Guide</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-olive sm:text-5xl">Returnships, explained</h1>
        <p className="mt-4 text-lg text-ink-soft">A returnship is a paid, structured way into a job for someone who has been out of paid work for a while. The word is used loosely, so it pays to know what you’re looking at.</p>
      </header>

      <section aria-labelledby="kinds-h" className="mt-12">
        <h2 id="kinds-h" className="font-serif text-2xl font-semibold text-olive">Four kinds of opportunity</h2>
        <p className="mt-2 text-ink-soft">The directory labels every listing as one of these.</p>
        <dl className="card mt-5 px-5">
          {KINDS.map(([t, d]) => <div key={t} className="border-b border-line py-4 last:border-0 sm:grid sm:grid-cols-[210px_1fr] sm:gap-5"><dt className="font-semibold text-ink">{t}</dt><dd className="text-ink-soft">{d}</dd></div>)}
        </dl>
      </section>

      <section aria-labelledby="checks-h" className="mt-12">
        <p className="eyebrow">Our view</p>
        <h2 id="checks-h" className="mt-2 font-serif text-2xl font-semibold text-olive">Six questions worth asking</h2>
        <p className="mt-2 text-ink-soft">This is our opinion, formed from how these programmes are usually built. It is fine to ask an employer any of these before applying.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {CHECKS.map(([q, a], n) => <li key={q} className="card p-5"><h3 className="font-semibold text-ink"><span aria-hidden="true" className="mr-2 font-serif text-rust">{n + 1}</span>{q}</h3><p className="mt-1.5 text-sm text-ink-soft">{a}</p></li>)}
        </ol>
      </section>

      <section aria-labelledby="cv-h" className="mt-12 max-w-3xl">
        <h2 id="cv-h" className="font-serif text-2xl font-semibold text-olive">About the years on your CV</h2>
        <p className="mt-3 text-ink-soft">You don’t owe anyone an account of them. Dates are enough; a line such as “2019 to 2024: not in paid employment” is complete and honest. If you want to say more, say it because it’s relevant, not because a form made you feel you had to.</p>
        <p className="mt-3 text-ink-soft">An employer who needs the years explained before they will read the rest has told you something useful about working there.</p>
      </section>

      <p className="mt-12 flex flex-wrap gap-3"><Link href="/opportunities?path=return" className="btn-primary">See returnships and programmes</Link><Link href="/opportunities" className="btn-secondary">Browse everything</Link></p>
    </div>
  );
}
