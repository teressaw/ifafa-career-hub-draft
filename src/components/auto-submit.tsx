'use client';
import { useEffect, useRef, useState } from 'react';

/** Progressive enhancement: submits the filter form when a select changes, and announces that results are updating.
 *  Without JavaScript, the "Show results" button does the same job. */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    const onChange = (e: Event) => { if ((e.target as HTMLElement).tagName === 'SELECT') form.requestSubmit(); };
    const onSubmit = () => setBusy(true);
    form.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    return () => { form.removeEventListener('change', onChange); form.removeEventListener('submit', onSubmit); };
  }, []);
  return (
    <span ref={ref} role="status" aria-live="polite" className={busy ? 'fixed inset-x-0 top-16 z-40 mx-auto w-fit rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white shadow-lg' : 'sr-only'}>
      {busy ? 'Updating results…' : ''}
    </span>
  );
}
