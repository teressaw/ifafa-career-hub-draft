import Image from 'next/image';
import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery } from '@/lib/filters';
import { HERO_ART, TAGLINE } from '@/lib/brand';
import { OpportunityCard } from '@/components/opportunity-card';
import { Notice } from '@/components/ui';

export const dynamic = 'force-dynamic';

const GOOD_RETURNSHIP = [
  ['It’s paid properly', 'At the rate for the role, with the salary or range stated up front.'],
  ['There’s a real job in it', 'Real work in a real team, and an honest answer about what happens at the end.'],
  ['Nobody asks you to explain', 'Eligibility is about time away, not the reason for it.'],
  ['The hours are stated', 'Part-time, flexible or full-time: you know before you apply.'],
  ['Managers are ready', 'Someone has thought about your first week before you arrive.'],
] as const;

export default async function Home() {
  const all = applyQuery(await listPublished(), parseQuery({}));
  const source = dataSource();
  const current = all.filter(o => o.appStatus === 'open' || o.appStatus === 'upcoming');
  const highlight = current.slice(0, 3);
  const examples = source === 'examples' || (all.length > 0 && all.every(o => o.is_example));

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container-page grid items-center gap-6 pb-10 pt-10 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:pb-14">
          <div>
            <h1 className="font-serif text-[64px] font-semibold leading-[0.95] tracking-[-0.04em] text-olive sm:text-[88px] lg:text-[104px]">
              workbreak<span className="text-rust">.</span>
            </h1>
            <p className="mt-3 font-serif text-[26px] italic leading-tight text-olive sm:text-[34px]">{TAGLINE}</p>
            <p className="mt-6 max-w-md text-lg text-ink-soft sm:text-xl">Find opportunities to return to paid employment. Help employers create more ways back.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/opportunities" className="btn-primary min-h-12 px-6 text-base">Find opportunities</Link>
              <Link href="/employers" className="btn-secondary min-h-12 px-6 text-base">For employers</Link>
            </div>
          </div>
          <Image src={HERO_ART.src} width={HERO_ART.width} height={HERO_ART.height} alt={HERO_ART.alt} priority sizes="(min-width: 1024px) 560px, 92vw"
            className="mx-auto h-auto w-full max-w-[460px] lg:max-w-none" />
        </div>
      </section>

      {/* What it is: two journeys */}
      <section aria-labelledby="what-h" className="border-y border-line bg-paper py-12 sm:py-14">
        <div className="container-page">
          <h2 id="what-h" className="max-w-3xl font-serif text-2xl font-medium leading-snug text-ink sm:text-[30px]">
            Workbreak is an Ireland-first guide to getting back into paid work after time away, whatever the time was for.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[14px] border border-line bg-cream p-6 sm:p-7">
              <p className="eyebrow">Returning to paid work</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-olive">A directory you can trust</h3>
              <p className="mt-2 text-ink-soft">Returnships, re-entry programmes and roles from employers who say time away is welcome. Each one links to its official source, shows when we last checked it, and says “not confirmed” where the employer hasn’t told us.</p>
              <Link href="/opportunities" className="link mt-4 inline-flex min-h-11 items-center">Browse opportunities →</Link>
            </div>
            <div className="rounded-[14px] border border-line bg-cream p-6 sm:p-7">
              <p className="eyebrow">Employers</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-olive">A pathway builder</h3>
              <p className="mt-2 text-ink-soft">Answer a few questions about roles, hours, pay and support. Get a practical starting plan for a return-to-work pathway, including the choices worth a second look. Free, and nothing you enter leaves your browser.</p>
              <Link href="/employers/pathway-builder" className="link mt-4 inline-flex min-h-11 items-center">Build a pathway →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Current opportunities */}
      <section aria-labelledby="now-h" className="py-12 sm:py-16">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Open or opening soon</p>
              <h2 id="now-h" className="mt-2 font-serif text-3xl font-semibold tracking-tight text-olive">Opportunities to look at now</h2>
            </div>
            {all.length > 0 && <Link href="/opportunities" className="btn-secondary">All {all.length} listings →</Link>}
          </div>
          {examples && <div className="mt-6"><Notice tone="example" title="Preview: these are example listings">They are fictional and appear only on preview and development copies of the site, never on the live one.</Notice></div>}
          {highlight.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{highlight.map(o => <OpportunityCard key={o.id} o={o} headingLevel="h3" />)}</div>
          ) : all.length ? (
            <p className="mt-6 max-w-2xl text-ink-soft">Nothing is confirmed as open right now. <Link href="/opportunities" className="link">Browse all listings</Link>, including programmes that run each year.</p>
          ) : (
            <div className="mt-6 max-w-2xl rounded-[14px] border border-line bg-paper p-6">
              <p className="font-serif text-xl font-semibold text-ink">We’re checking our first listings.</p>
              <p className="mt-2 text-ink-soft">Workbreak is new. We publish an opportunity only after a person has checked it against the employer’s own page, so the directory starts small. We would rather show you nothing than something we can’t stand over.</p>
              <p className="mt-3"><Link href="/returnships" className="link">What to look for in a returnship, in the meantime →</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* What good looks like */}
      <section aria-labelledby="good-h" className="border-y border-line bg-stone-2 py-12 sm:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Our view</p>
            <h2 id="good-h" className="mt-2 font-serif text-3xl font-semibold tracking-tight text-olive">What a good returnship looks like</h2>
            <p className="mt-3 text-ink-soft">“Returnship” isn’t a protected word. Some are excellent. Some are a long interview on low pay. Five things to check.</p>
            <Link href="/returnships" className="link mt-4 inline-flex min-h-11 items-center">Returnships, explained →</Link>
          </div>
          <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {GOOD_RETURNSHIP.map(([h, p], n) => (
              <li key={h} className="flex gap-3">
                <span aria-hidden="true" className="font-serif text-2xl font-semibold leading-none text-rust">{n + 1}</span>
                <div><h3 className="font-semibold text-ink">{h}</h3><p className="mt-0.5 text-sm text-ink-soft">{p}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why */}
      <section aria-labelledby="why-h" className="-mb-24 py-14 sm:py-20">
        <div className="container-page max-w-3xl">
          <h2 id="why-h" className="eyebrow">Why Workbreak</h2>
          <p className="mt-4 font-serif text-[26px] leading-snug text-ink sm:text-[32px]">Time outside paid work isn’t empty time. People care, move, recover, raise children and live. Then many want paid work again, and meet a hiring system that treats those years as a hole.</p>
          <p className="mt-5 text-lg text-ink-soft">Paid work matters: income, independence, somewhere to use what you’re good at. Getting back to it shouldn’t require an apology. So we point to the routes that exist, and help employers build better ones.</p>
          <p className="mt-5"><Link href="/about" className="link">About Workbreak →</Link></p>
        </div>
      </section>
    </>
  );
}
