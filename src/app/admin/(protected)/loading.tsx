export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-56 animate-pulse rounded bg-stone-2" />
      <div className="mt-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
    </div>
  );
}
