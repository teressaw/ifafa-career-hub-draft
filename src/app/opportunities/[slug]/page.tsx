import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedBySlug } from '@/lib/opportunities';
import { applicationStatus, formatDate } from '@/lib/status';
import { CAREER_BREAK, PROGRAMME_TYPES, REGIONS, SECTORS, WORK_ARRANGEMENTS } from '@/lib/types';
import { ExampleBadge, Notice, Paragraphs, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/opportunities/[slug]'>): Promise<Metadata> {
  const o = await getPublishedBySlug((await params).slug);
  return o ? { title: `${o.programme_name} — ${o.employer}`, description: o.summary } : { title: 'Opportunity not found' };
}

const NOT_CONFIRMED = 'Not confirmed — check the official listing';

function Fact({ term, value, muted }: { term: string; value: string; muted?: boolean }) {
  return (
    <div className="border-b border-line py-3.5 last:border-0 sm:grid sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-muted">{term}</dt>
      <dd className={`mt-0.5 sm:mt-0 ${muted ? 'text-muted italic' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

export default async function OpportunityPage({ params }: PageProps<'/opportunities/[slug]'>) {
  const o = await getPublishedBySlug((await params).slug);
  if (!o) notFound();
  const { status, reason } = applicationStatus(o);
  const opens = o.dates_verified && o.opens_on ? formatDate(o.opens_on) : null;
  const closes = o.dates_verified && o.closes_on ? formatDate(o.closes_on) : null;
  const applyHref = o.application_url ?? o.source_url;

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/opportunities" className="inline-flex min-h-11 items-center font-semibold text-forest hover:underline">← All opportunities</Link>
      </nav>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_340px]">
        <article>
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={status} size="md" />{o.is_example && <ExampleBadge />}</div>
          <p className="mt-6 text-base font-semibold text-muted">{o.employer}</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{o.programme_name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{o.summary}</p>

          <div className="mt-8 space-y-3">
            {o.is_example && <Notice tone="example" title="This is an example listing">The employer, programme and links are fictional and are shown only to demonstrate the directory.</Notice>}
            {status === 'unverified' && <Notice tone="warn" title="Status not verified">{reason} Details below may be out of date.</Notice>}
            {status === 'closed' && <Notice title="Applications have closed">Many programmes run each year. Check the official source for future intakes, or <Link href="/opportunities?status=open" className="font-semibold underline">see what is open now</Link>.</Notice>}
          </div>

          <section aria-labelledby="about" className="mt-10">
            <h2 id="about" className="font-serif text-2xl font-semibold">About this opportunity</h2>
            <div className="mt-4 text-ink-soft"><Paragraphs text={o.description} /></div>
          </section>

          <section aria-labelledby="eligibility" className="mt-10">
            <h2 id="eligibility" className="font-serif text-2xl font-semibold">Eligibility</h2>
            <div className="mt-4 text-ink-soft">{o.eligibility ? <Paragraphs text={o.eligibility} /> : <p className="italic text-muted">The employer has not published eligibility criteria that we could verify. Check the official listing.</p>}</div>
            <p className="mt-3 text-sm"><span className="font-semibold">Career breaks:</span> {CAREER_BREAK[o.career_break]}</p>
          </section>

          <section aria-labelledby="facts" className="mt-10">
            <h2 id="facts" className="font-serif text-2xl font-semibold">Key details</h2>
            <dl className="card mt-4 px-5">
              <Fact term="Employer" value={o.employer} />
              <Fact term="Programme" value={o.programme_name} />
              <Fact term="Programme type" value={PROGRAMME_TYPES[o.programme_type]} />
              <Fact term="Sector" value={SECTORS[o.sector]} />
              <Fact term="Location" value={`${o.location} · ${REGIONS[o.region]}`} />
              <Fact term="Working arrangement" value={WORK_ARRANGEMENTS[o.work_arrangement]} />
              <Fact term="Duration" value={o.duration ?? NOT_CONFIRMED} muted={!o.duration} />
              <Fact term="Compensation" value={o.compensation ?? NOT_CONFIRMED} muted={!o.compensation} />
            </dl>
          </section>
        </article>

        <aside className="lg:pt-2">
          <div className="card space-y-5 p-6 lg:sticky lg:top-24">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Application</h2>
              <div className="mt-3"><StatusBadge status={status} size="md" /></div>
              <p className="mt-3 text-sm text-ink-soft">{reason}</p>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-semibold text-muted">Opens</dt><dd className={opens ? 'text-ink' : 'italic text-muted'}>{opens ?? (o.dates_verified && o.closes_on ? 'No opening date published' : 'Not confirmed')}</dd></div>
              <div><dt className="font-semibold text-muted">Closes</dt><dd className={closes ? 'font-semibold text-ink' : 'italic text-muted'}>{closes ?? (o.dates_verified && o.opens_on ? 'No closing date published' : 'Not confirmed')}</dd></div>
            </dl>
            <a href={applyHref} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
              {o.application_url ? (status === 'closed' ? 'View the application page' : 'Apply on the official site') : 'View the official source'}<span className="sr-only"> (opens in a new tab)</span> <span aria-hidden="true">↗</span>
            </a>
            <div className="border-t border-line pt-5 text-sm">
              <h2 className="font-semibold text-ink">Verification</h2>
              <p className="mt-2 text-ink-soft">{o.last_verified_on ? <>Last checked by an IFAFA volunteer on <strong className="text-ink">{formatDate(o.last_verified_on)}</strong>.</> : 'Not yet checked by a volunteer.'}</p>
              <p className="mt-2 break-words"><span className="font-semibold text-muted">Source: </span><a href={o.source_url} target="_blank" rel="noopener noreferrer" className="text-forest underline underline-offset-2">{o.source_url.replace(/^https?:\/\//, '')}</a></p>
              <p className="mt-3 text-xs text-muted">Always confirm details with the employer before applying.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
