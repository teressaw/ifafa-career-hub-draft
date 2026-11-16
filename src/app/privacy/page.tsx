import type { Metadata } from 'next';
import { contactEmail, mailto } from '@/lib/contact';

export const metadata: Metadata = { title: 'Privacy', description: 'What Workbreak does and does not collect.' };

export default function Privacy() {
  const email = contactEmail();
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Privacy</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-olive">What we collect</h1>
      <p className="mt-4 text-lg text-ink-soft">As little as possible. This page describes how the site works today.</p>
      <dl className="mt-8 space-y-6 text-ink-soft">
        <div><dt className="font-semibold text-ink">Browsing the site</dt><dd className="mt-1">No account is needed. We don’t use advertising or analytics trackers, and we set no cookies for visitors. Searches and filters are part of the page address and aren’t stored by us.</dd></div>
        <div><dt className="font-semibold text-ink">The employer pathway builder</dt><dd className="mt-1">Your answers are saved only in your own browser so you can come back to them. They are not sent to us. “Start again” deletes them.</dd></div>
        <div><dt className="font-semibold text-ink">Hosting</dt><dd className="mt-1">The site is hosted by Vercel and, where a database is in use, Supabase. Like any web host, they process technical data such as IP addresses in server logs to deliver and protect the site.</dd></div>
        <div><dt className="font-semibold text-ink">People who maintain listings</dt><dd className="mt-1">Team members sign in with an email address and password, and a cookie keeps them signed in. We record who created or last changed a listing.</dd></div>
        <div><dt className="font-semibold text-ink">Links to other sites</dt><dd className="mt-1">Listings link to employers’ and providers’ own sites, which have their own privacy practices.</dd></div>
        <div><dt className="font-semibold text-ink">Contact</dt><dd className="mt-1">{email ? <>Questions or requests about your data: <a href={mailto(email, 'Workbreak privacy')} className="link">{email}</a>.</> : 'A contact address will be published here before launch.'}</dd></div>
      </dl>
      <p className="mt-8 text-sm text-muted">This is a plain-language description, not a formal legal notice. It will be reviewed before public launch.</p>
    </div>
  );
}
