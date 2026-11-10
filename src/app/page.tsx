import Link from 'next/link';
import { listPublished, dataSource } from '@/lib/opportunities';
import { applyQuery, parseQuery, PATHS, type PathKey } from '@/lib/filters';
import { forPath, RESOURCE_KINDS, type ResourceKind } from '@/lib/resources';
import { publishedResourceIndex } from '@/lib/resources-data';
import { contactEmail, mailto } from '@/lib/contact';
import { OpportunityCard } from '@/components/opportunity-card';
import { Notice } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** The three career pathways. Card copy comes from the redesign; what each one shows is defined in PATHS (src/lib/filters.ts). */
const PATH_CARDS: { key: PathKey; icon: string; title: string; text: string; next: string }[] = [
  { key: 'abroad', icon: '◎', title: 'I’m living overseas', text: 'Explore internationally compatible work, flexible projects and ways to keep your professional network growing.',
    next: 'Start with opportunities confirmed as possible from outside Ireland, freelance projects, virtual networking and skills development. Always check country-specific eligibility.' },
  { key: 'return', icon: '✈', title: 'I’m preparing to return', text: 'Discover Irish returnships, recruitment pathways and opportunities to plan your next move.',
    next: 'Explore Irish returnships, upcoming recruitment programmes and career support you can access before relocating.' },
  { key: 'restart', icon: '↻', title: 'I’m restarting my career', text: 'Find coaching, training and practical support for re-entering work after a career break.',
    next: 'Begin with free or funded coaching, CV support, professional networks and structured return-to-work programmes.' },
];

const TILES: { href: string; kind: ResourceKind | 'opportunities'; icon: string; title: string; text: string }[] = [
  { href: '/opportunities', kind: 'opportunities', icon: '▣', title: 'Opportunities', text: 'Returnships, re-entry programmes, flexible roles and training in Ireland.' },
  { href: '/events', kind: 'event', icon: '▦', title: 'Events', text: 'Free webinars, career workshops and professional networking opportunities.' },
  { href: '/support', kind: 'support', icon: '♧', title: 'Career support', text: 'Free or funded coaching, CV support and professional networks.' },
  { href: '/resources', kind: 'resource', icon: '▤', title: 'Practical resources', text: 'Guidance on career breaks, work eligibility and preparing to return to Ireland.' },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function Home({ searchParams }: PageProps<'/'>) {
  const raw = (await searchParams).path;
  const selected = (typeof raw === 'string' && raw in PATHS ? raw : '') as PathKey | '';
  const all = applyQuery(await listPublished(), parseQuery({}));
  const res = await publishedResourceIndex();
  const highlight = all.filter(o => o.appStatus === 'open' || o.appStatus === 'upcoming').slice(0, 3);
  const openNow = all.filter(o => o.appStatus === 'open').length;
  const examples = dataSource() === 'examples' || (all.length > 0 && all.every(o => o.is_example));
  const email = contactEmail();

  const kindCount = (k: ResourceKind, path: PathKey | '' = '') => res.filter(r => r.kind === k && forPath(r, path)).length;
  const sel = selected ? PATH_CARDS.find(c => c.key === selected)! : null;
  const selOpps = selected ? all.filter(o => PATHS[selected].match(o)) : [];

  return (
    <>
      {/* Hero */}
      <section className="bg-[linear-gradient(115deg,#e9f2ed_0%,#f6f9f6_55%,#e7eef5_100%)] py-14 sm:py-20">
        <div className="container-page">
          <p className="eyebrow">For accompanying partners of Irish diplomatic staff</p>
          <h1 className="mt-4 max-w-3xl font-serif text-[40px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-[66px]">Continue, develop or restart your career.</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft sm:text-[19px]">Find opportunities and practical support for working during a posting, preparing to return to Ireland or re-entering employment.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#pathways" className="btn-primary">Find your next step →</a>
            <a href="#explore" className="btn-secondary">Explore the Hub</a>
          </div>
          <form action="/opportunities" method="get" role="search" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="home-q" className="sr-only">Search opportunities</label>
            <input id="home-q" name="q" type="search" placeholder="Search opportunities, e.g. “finance” or “Dublin”" className="field min-h-12" maxLength={100} />
            <button className="btn-secondary min-h-12 px-6">Search</button>
          </form>
          <ul className="mt-9 flex flex-col gap-3 text-sm font-bold sm:flex-row sm:gap-8">
            {['Checked against official sources', 'Career support & networking', 'Practical resources'].map(h => <li key={h}><span aria-hidden="true" className="mr-2 text-forest">✓</span>{h}</li>)}
          </ul>
        </div>
      </section>

      {/* Pathways */}
      <section id="pathways" aria-labelledby="pathways-h" className="scroll-mt-28 py-14 sm:py-16">
        <div className="container-page">
          <h2 id="pathways-h" className="font-serif text-3xl font-semibold tracking-tight sm:text-[40px]">Where are you in your career journey?</h2>
          <p className="mt-2 text-muted">Choose the situation that best describes you.</p>
          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {PATH_CARDS.map(c => {
              const on = c.key === selected;
              return (
                <li key={c.key}>
                  <Link href={on ? '/#pathways' : `/?path=${c.key}#pathways`} scroll={false} aria-current={on ? 'true' : undefined}
                    className={`card flex h-full flex-col p-7 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-[#8ebaa5] ${on ? 'outline-2 outline-forest' : ''}`}>
                    <span aria-hidden="true" className="text-[28px]">{c.icon}</span>
                    <h3 className="mt-3 text-xl font-bold">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted">{c.text}</p>
                    <span className="mt-auto block pt-5 font-extrabold text-forest">{on ? 'Selected ✓' : 'Explore this path →'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {sel && selected && (
            <section aria-labelledby="sel-h" aria-live="polite" className="mt-5 rounded-2xl border border-[#c9ddce] bg-sage px-6 py-5">
              <h3 id="sel-h" className="font-bold">{PATHS[selected].title}</h3>
              <p className="mt-1 text-[#3e5d4e]">{sel.next}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <li><Link href={`/opportunities?path=${selected}`} className="card flex min-h-14 items-center justify-between gap-2 px-4 py-3 font-semibold hover:border-forest"><span>Opportunities</span><span className="text-sm font-normal text-muted">{selOpps.length}</span></Link></li>
                {(['support', 'event', 'resource'] as const).map(k => (
                  <li key={k}><Link href={`${RESOURCE_KINDS[k].href}?path=${selected}`} className="card flex min-h-14 items-center justify-between gap-2 px-4 py-3 font-semibold hover:border-forest"><span>{RESOURCE_KINDS[k].plural}</span><span className="text-sm font-normal text-muted">{kindCount(k, selected)}</span></Link></li>
                ))}
              </ul>
              {selected === 'abroad' && selOpps.length === 0 && <p className="mt-3 text-sm text-[#3e5d4e]">No opportunity has been confirmed as possible from outside Ireland yet. <Link href="/opportunities?arrangement=remote" className="font-semibold underline">See remote listings</Link> — but check each one’s location rules.</p>}
              {examples && <p className="mt-3 text-xs text-muted">Opportunity counts currently include example listings.</p>}
            </section>
          )}
        </div>
      </section>

      {/* Explore */}
      <section id="explore" aria-labelledby="explore-h" className="scroll-mt-28 bg-stone-2 py-14 sm:py-16">
        <div className="container-page">
          <h2 id="explore-h" className="font-serif text-3xl font-semibold tracking-tight sm:text-[40px]">Explore the Hub</h2>
          <p className="mt-2 text-muted">Focused resources and opportunities, without the noise of a general jobs board.</p>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TILES.map(t => {
              const n = t.kind === 'opportunities' ? all.length : kindCount(t.kind);
              const status = t.kind === 'opportunities' ? `${plural(n, 'listing', 'listings')} · ${openNow} open now` : n ? `${plural(n, 'item', 'items')} listed` : 'Nothing listed yet';
              return (
                <li key={t.href}>
                  <Link href={t.href} className="card flex h-full flex-col p-6 hover:border-forest">
                    <span aria-hidden="true" className="text-[26px]">{t.icon}</span>
                    <h3 className="mt-3 text-[17px] font-bold">{t.title}</h3>
                    <p className="mt-2 text-sm text-muted">{t.text}</p>
                    <span className="mt-auto pt-5 text-sm font-extrabold text-forest">{status} →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-7 rounded-r-xl border-l-[3px] border-forest bg-white px-5 py-4 text-sm text-ink-soft">
            <strong className="text-ink">A note on remote work:</strong> “Remote” does not always mean “work from any country.” Listings show whether working from outside Ireland has been confirmed with the employer, and say so when it hasn’t.
          </p>
        </div>
      </section>

      {/* Live opportunities (kept from the previous homepage) */}
      <section aria-labelledby="now-h" className="py-14 sm:py-16">
        <div className="container-page">
          {examples && <div className="mb-8"><Notice tone="example" title="These are example listings">The directory currently shows fictional examples to demonstrate how it works. Real, verified opportunities will replace them.</Notice></div>}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Open and opening soon</p>
              <h2 id="now-h" className="mt-2 font-serif text-3xl font-semibold tracking-tight">Opportunities to look at now</h2>
            </div>
            <Link href="/opportunities" className="btn-secondary">Browse all opportunities →</Link>
          </div>
          {highlight.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{highlight.map(o => <OpportunityCard key={o.id} o={o} headingLevel="h3" />)}</div>
          ) : (
            <p className="mt-8 text-muted">No programmes are confirmed as open right now. <Link href="/opportunities" className="font-semibold text-forest underline">Browse all listings</Link>, including those opening later.</p>
          )}
          <p className="mt-6 text-sm text-muted">Every listing links to its official source and shows when it was last checked. <Link href="/about" className="font-semibold text-forest underline underline-offset-4">What each status means</Link></p>
        </div>
      </section>

      {/* Every stage */}
      <section aria-labelledby="stages-h" className="pb-14 sm:pb-16">
        <div className="container-page">
          <span className="inline-block rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-[#236446]">Designed around accompanying partners</span>
          <h2 id="stages-h" className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-[40px]">Useful support at every stage.</h2>
          <p className="mt-2 max-w-2xl text-muted">Concrete next steps, whether you’re currently abroad or planning a return. No account needed.</p>
          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {([['abroad', 'Working while abroad', 'Focus on roles with clear cross-border eligibility, alongside freelance and professional development options.'],
               ['return', 'Returning to Ireland', 'Find return-to-work programmes and understand application timelines before you move.'],
               ['restart', 'Rebuilding momentum', 'Discover coaching, training and professional connections without having to start from scratch.']] as const).map(([k, h, p]) => (
              <li key={k} className="card p-7"><h3 className="text-xl font-bold">{h}</h3><p className="mt-2 text-sm text-muted">{p}</p><Link href={`/?path=${k}#pathways`} className="mt-4 inline-flex min-h-10 items-center text-sm font-extrabold text-forest">See this path →</Link></li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call to action */}
      <section aria-labelledby="cta-h" className="-mb-24 bg-navy py-14 text-white">
        <div className="container-page">
          <h2 id="cta-h" className="font-serif text-3xl font-semibold tracking-tight">Help shape a more useful career resource.</h2>
          <p className="mt-3 max-w-2xl text-[#cbd7e3]">Know of a programme, opportunity or free event? Share it with the IFAFA team — a volunteer checks every suggestion against the official source before it is added.</p>
          {email && <a href={mailto(email, 'Suggest a Career Hub resource')} className="btn mt-6 bg-[#d5f1df] text-[#164e35] hover:bg-white">Suggest a resource →</a>}
        </div>
      </section>
    </>
  );
}
