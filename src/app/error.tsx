'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold">We couldn’t load this page</h1>
      <p className="mt-3 max-w-md text-ink-soft">This is usually temporary. Please try again — if it keeps happening, let an IFAFA volunteer know.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={() => retry()} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Go to the home page</Link>
      </div>
    </div>
  );
}
