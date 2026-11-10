export function AuthShell({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <p className="eyebrow">IFAFA volunteers</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">{title}</h1>
        {intro && <div className="mt-3 text-sm text-ink-soft">{intro}</div>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
