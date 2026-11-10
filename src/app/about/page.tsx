import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui';
import { VERIFICATION_MAX_AGE_DAYS } from '@/lib/status';

export const metadata: Metadata = { title: 'How listings work' };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">About the directory</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">How listings work</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        IFAFA Career Hub gathers returnships, career re-entry programmes and employment pathways in Ireland that may suit accompanying partners of Irish diplomatic staff — people whose careers have often been shaped, and sometimes interrupted, by overseas postings.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="font-serif text-2xl font-semibold">How each listing is checked</h2>
        <ol className="list-decimal space-y-3 pl-5 leading-relaxed text-ink-soft marker:font-semibold marker:text-forest">
          <li>A volunteer finds the opportunity on the employer’s or programme’s own website, and records that page as the <strong>source</strong>.</li>
          <li>They copy only what the source says. Application dates, eligibility criteria and pay are never estimated: if the source doesn’t state them, the listing says <em>not confirmed</em>.</li>
          <li>Dates are shown only when the volunteer has confirmed them at the source.</li>
          <li>Each listing shows the date it was <strong>last checked</strong>. Listings not re-checked within {Math.round(VERIFICATION_MAX_AGE_DAYS / 30)} months are automatically shown as unverified.</li>
          <li>A second look by a volunteer is needed before a listing is published.</li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold">Application statuses</h2>
        <dl className="mt-5 space-y-4">
          <div className="card p-5"><dt><StatusBadge status="open" /></dt><dd className="mt-2 text-ink-soft">Within the verified application window, or confirmed as open (for example, rolling applications) when last checked.</dd></div>
          <div className="card p-5"><dt><StatusBadge status="upcoming" /></dt><dd className="mt-2 text-ink-soft">A verified opening date is in the future, or the source says applications will open soon. Dates are shown only if confirmed.</dd></div>
          <div className="card p-5"><dt><StatusBadge status="closed" /></dt><dd className="mt-2 text-ink-soft">The verified closing date has passed, or the source said applications were closed. Closed listings stay visible because many programmes run each year.</dd></div>
          <div className="card p-5"><dt><StatusBadge status="unverified" /></dt><dd className="mt-2 text-ink-soft">The listing hasn’t been checked recently, or its status couldn’t be confirmed. Treat its details with care and check the source.</dd></div>
        </dl>
      </section>

      <section className="mt-12 space-y-3 leading-relaxed text-ink-soft">
        <h2 className="font-serif text-2xl font-semibold text-ink">Important</h2>
        <p>IFAFA does not run these programmes and is not responsible for employers’ decisions. Always confirm details with the employer before applying.</p>
        <p>Spotted something out of date? Let an IFAFA volunteer know so the listing can be re-checked.</p>
      </section>
      <Link href="/opportunities" className="btn-primary mt-10">Browse opportunities</Link>
    </div>
  );
}
