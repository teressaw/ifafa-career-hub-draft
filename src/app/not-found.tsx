import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-3 max-w-md text-ink-soft">The listing may have been archived, or the link may be out of date.</p>
      <Link href="/opportunities" className="btn-primary mt-8">Browse opportunities</Link>
    </div>
  );
}
