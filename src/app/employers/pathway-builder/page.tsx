import type { Metadata } from 'next';
import Link from 'next/link';
import { PathwayBuilder } from '@/components/employers/pathway-builder';

export const metadata: Metadata = {
  title: 'Pathway builder for employers',
  description: 'Turn your choices about roles, hours, pay and support into a practical starting plan for a return-to-work pathway.',
};

export default function PathwayBuilderPage() {
  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="no-print text-sm"><Link href="/employers" className="inline-flex min-h-11 items-center font-semibold text-olive hover:underline">← For employers</Link></nav>
      <header className="no-print mt-2 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-olive">Pathway builder</h1>
        <p className="mt-3 text-lg text-ink-soft">Make the main decisions about a return-to-work pathway, and leave with a plan you can take to your team.</p>
      </header>
      <div className="mt-8"><PathwayBuilder /></div>
      <noscript><p className="mt-6 rounded-xl bg-mustard-soft px-4 py-3">The builder needs JavaScript. The guidance behind it is on the <a href="/employers" className="underline">employers page</a>.</p></noscript>
    </div>
  );
}
