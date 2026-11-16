import type { Metadata } from 'next';
import Link from 'next/link';
import { contactEmail, mailto } from '@/lib/contact';

export const metadata: Metadata = { title: 'About', description: 'What Workbreak is, who runs it, and how listings are checked.' };

export default function About() {
  const email = contactEmail();
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">About</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-olive sm:text-5xl">Life isn’t a career break.</h1>
      <div className="mt-6 space-y-4 text-lg text-ink-soft">
        <p>Workbreak helps people in Ireland return to paid work after time away, and helps employers create better ways back.</p>
        <p>The usual phrase for that time is a “career break”, as if a career were the main event and everything else an interruption. We think it’s the other way round. People spend years caring for someone, raising children, moving country, being ill, recovering, or doing something else entirely. That is life, not a gap in it.</p>
        <p>Paid work matters too: for income, independence and the plain satisfaction of being good at something. What we object to is the toll charged on the way back in. So Workbreak does two practical things. It lists routes back that exist, checked and honestly described. And it gives employers a tool for building better ones.</p>
      </div>

      <section id="listings" aria-labelledby="listings-h" className="mt-14 scroll-mt-28">
        <h2 id="listings-h" className="font-serif text-2xl font-semibold text-olive sm:text-3xl">How listings are checked</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-ink-soft marker:text-rust">
          <li><strong className="text-ink">A person checks every listing</strong> against the employer’s or provider’s own page before it is published. Nothing is published automatically.</li>
          <li><strong className="text-ink">Every listing links to its source</strong> and shows the date it was last checked.</li>
          <li><strong className="text-ink">Dates appear only when confirmed</strong> at the source. Otherwise the listing says so.</li>
          <li><strong className="text-ink">Missing information is shown as missing.</strong> If an employer doesn’t state pay, duration or eligibility, the listing says “Not confirmed”. We don’t guess.</li>
          <li><strong className="text-ink">Old checks expire.</strong> A listing not re-checked within 120 days is shown as “Status unverified” until someone looks again.</li>
          <li><strong className="text-ink">Placement isn’t for sale.</strong> Employers cannot pay to be listed or ranked.</li>
        </ul>
        <h3 className="mt-8 font-semibold text-ink">What each status means</h3>
        <dl className="card mt-3 px-5 text-ink-soft">
          {[['Open now', 'Within confirmed application dates, or recorded as open (for example, rolling applications) at the last check.'],
            ['Opening soon', 'A confirmed opening date is ahead, or the provider says an intake is expected.'],
            ['Closed', 'The confirmed closing date has passed. Many programmes run every year.'],
            ['Status unverified', 'Not checked recently enough for us to say. Go to the source.']].map(([t, d]) => (
            <div key={t} className="border-b border-line py-3.5 last:border-0 sm:grid sm:grid-cols-[170px_1fr] sm:gap-4"><dt className="font-semibold text-ink">{t}</dt><dd>{d}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">Details change. Always confirm eligibility, dates and pay with the employer before applying.</p>
      </section>

      <section aria-labelledby="stage-h" className="mt-14">
        <h2 id="stage-h" className="font-serif text-2xl font-semibold text-olive sm:text-3xl">Where we are</h2>
        <div className="mt-4 space-y-3 text-ink-soft">
          <p>Workbreak is an independent project at an early stage. It covers Ireland first. The directory is small and growing, because we add a listing only once it has been checked.</p>
          <p>We don’t give individual legal, tax or immigration advice, and nothing here is a substitute for it.</p>
          {email && <p>Spotted something out of date, or know a programme we should list? <a href={mailto(email, 'Workbreak')} className="link">Tell us</a>.</p>}
        </div>
      </section>

      <p className="mt-12 flex flex-wrap gap-3"><Link href="/opportunities" className="btn-primary">Find opportunities</Link><Link href="/employers" className="btn-secondary">For employers</Link></p>
    </div>
  );
}
