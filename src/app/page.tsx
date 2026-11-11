import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery } from '@/lib/filters';
import { publishedResourceIndex } from '@/lib/resources-data';
import { OpportunityCard } from '@/components/opportunity-card';
import { Notice } from '@/components/ui';
import { contactEmail, mailto } from '@/lib/contact';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const opportunities = applyQuery(await listPublished(), parseQuery({}));
  const resources = await publishedResourceIndex();
  const featured = opportunities.filter(o => o.appStatus === 'open' || o.appStatus === 'upcoming').slice(0, 3);
  const examples = dataSource() === 'examples' || (opportunities.length > 0 && opportunities.every(o => o.is_example));
  const email = contactEmail();
  return <>
    <section className="relative overflow-hidden bg-[#eaf2ec] py-16 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 size-[480px] rounded-full border-[70px] border-white/35" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          <p className="eyebrow">IFAFA · Career support for accompanying partners</p>
          <h1 className="mt-5 max-w-3xl font-serif text-[43px] font-semibold leading-[1.09] tracking-tight sm:text-[62px]">Your career can have a next chapter.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">Practical support for Irish diplomatic partners developing their careers overseas or preparing to work in Ireland again.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="#choose" className="btn-primary">Find your pathway →</Link><Link href="/opportunities" className="btn-secondary">Explore opportunities</Link></div>
          <p className="mt-6 text-sm text-muted">Curated resources · Irish career opportunities · No account needed</p>
        </div>
        <div className="hidden rounded-[28px] border border-white/80 bg-white/70 p-8 shadow-[0_24px_80px_#143a2b14] lg:block">
          <p className="eyebrow">Two ways forward</p>
          <div className="mt-6 border-b border-line pb-6"><span className="text-3xl">↗</span><h2 className="mt-2 font-serif text-2xl font-semibold">Grow while abroad</h2><p className="mt-2 text-sm leading-relaxed text-muted">Skills, qualifications, mentoring and professional connections.</p></div>
          <div className="pt-6"><span className="text-3xl">⌂</span><h2 className="mt-2 font-serif text-2xl font-semibold">Return with confidence</h2><p className="mt-2 text-sm leading-relaxed text-muted">Irish vacancies, returnships and career re-entry support.</p></div>
        </div>
      </div>
    </section>
    <section id="choose" className="container-page scroll-mt-28 py-16 sm:py-20">
      <p className="eyebrow">Start here</p><h2 className="mt-3 font-serif text-3xl font-semibold sm:text-[42px]">What would help you right now?</h2>
      <p className="mt-3 max-w-2xl text-muted">Choose a pathway. You can explore both, and you never need to create an account.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="card flex flex-col p-8 sm:p-10"><div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-mint text-3xl text-forest">↗</div><p className="eyebrow">While on posting</p><h3 className="mt-2 font-serif text-3xl font-semibold">Develop your career abroad</h3><p className="mt-4 flex-1 leading-relaxed text-ink-soft">Find online learning, qualifications, mentoring and career development resources that can support your next move, without suggesting overseas employment eligibility.</p><Link href="/resources?path=abroad" className="btn-primary mt-8 self-start">Explore development resources →</Link></article>
        <article className="card flex flex-col p-8 sm:p-10"><div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#e9eef7] text-3xl text-navy">⌂</div><p className="eyebrow">Preparing for Ireland</p><h3 className="mt-2 font-serif text-3xl font-semibold">Return to work in Ireland</h3><p className="mt-4 flex-1 leading-relaxed text-ink-soft">Explore Irish vacancies, returnships and career re-entry programmes, alongside practical support for navigating a career break or transition.</p><Link href="/opportunities" className="btn-primary mt-8 self-start">Browse Irish opportunities →</Link></article>
      </div>
    </section>
    <section className="bg-stone-2 py-16"><div className="container-page"><p className="eyebrow">Explore the hub</p><h2 className="mt-2 font-serif text-3xl font-semibold sm:text-[40px]">Practical help, not another jobs board.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[{href:'/opportunities',icon:'▣',title:'Irish opportunities',desc:'Jobs, returnships and structured re-entry programmes.',count:examples?'Pilot directory':`${opportunities.length} listings`},{href:'/support',icon:'◇',title:'Career support',desc:'Coaching, mentoring, CV guidance and professional networks.',count:`${resources.filter(r=>r.kind==='support').length} resources`},{href:'/resources',icon:'▤',title:'Learning & resources',desc:'Professional development, qualifications and practical guidance.',count:`${resources.filter(r=>r.kind==='resource').length} resources`}].map(t=><Link key={t.href} href={t.href} className="card group flex flex-col p-7 transition hover:-translate-y-1 hover:border-forest"><span className="text-3xl text-forest">{t.icon}</span><h3 className="mt-5 text-xl font-bold">{t.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t.desc}</p><span className="mt-6 text-sm font-bold text-forest">{t.count} · Explore →</span></Link>)}
      </div>
    </div></section>
    <section className="container-page py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Irish opportunities</p><h2 className="mt-2 font-serif text-3xl font-semibold sm:text-[40px]">Worth a closer look</h2><p className="mt-2 text-muted">Listings are reviewed by volunteers before publication.</p></div><Link href="/opportunities" className="btn-secondary">View the directory →</Link></div>
      {examples && <div className="mt-7"><Notice tone="example" title="Demonstration listings">These listings are fictional examples, not live opportunities. They will be replaced by reviewed, real listings.</Notice></div>}
      {featured.length ? <div className="mt-7 grid gap-5 md:grid-cols-3">{featured.map(o=><OpportunityCard key={o.id} o={o} headingLevel="h3" />)}</div> : <div className="card mt-7 p-8"><h3 className="font-semibold">The first opportunities are being reviewed</h3><p className="mt-2 text-muted">Check back for verified listings, or explore the resources available now.</p></div>}
    </section>
    <section className="bg-navy py-14 text-white"><div className="container-page flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><h2 className="font-serif text-3xl font-semibold">Know a useful programme?</h2><p className="mt-2 max-w-2xl text-[#d2deea]">Help IFAFA keep the Hub relevant. Volunteers review every suggested resource before publishing it.</p></div>{email && <a href={mailto(email,'Suggest a Career Hub resource')} className="btn bg-white text-forest hover:bg-mint">Suggest a resource →</a>}</div></section>
  </>;
}
