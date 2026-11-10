import Link from 'next/link';
import type { ApplicationStatus } from '@/lib/types';
import { APPLICATION_STATUSES } from '@/lib/types';

const STATUS_STYLE: Record<ApplicationStatus, { cls: string; icon: string }> = {
  open: { cls: 'bg-open-bg text-open ring-open/20', icon: '●' },
  upcoming: { cls: 'bg-upcoming-bg text-upcoming ring-upcoming/20', icon: '◷' },
  closed: { cls: 'bg-closed-bg text-closed ring-closed/20', icon: '○' },
  unverified: { cls: 'bg-unverified-bg text-unverified ring-unverified/25', icon: '?' },
};

/** Status is always shown as icon + words, never colour alone. */
export function StatusBadge({ status, size = 'sm' }: { status: ApplicationStatus; size?: 'sm' | 'md' }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${s.cls} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'}`}>
      <span aria-hidden="true">{s.icon}</span>
      {APPLICATION_STATUSES[status]}
    </span>
  );
}

export function ExampleBadge() {
  return <span className="inline-flex items-center rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-gold ring-1 ring-inset ring-gold/30">Example listing</span>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-stone-2 px-2.5 py-0.5 text-xs font-medium text-ink-soft">{children}</span>;
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div aria-hidden="true" className="mb-4 grid size-12 place-items-center rounded-full bg-mint text-xl text-forest">⌕</div>
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'example'; title: string; children?: React.ReactNode }) {
  const cls = { info: 'border-upcoming/20 bg-upcoming-bg', warn: 'border-unverified/25 bg-unverified-bg', example: 'border-gold/30 bg-gold-soft' }[tone];
  return (
    <div role={tone === 'warn' ? 'alert' : 'note'} className={`rounded-2xl border px-5 py-4 text-sm ${cls}`}>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-ink-soft">{children}</div>}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest">{children}</Link>;
}

/** Plain text with blank-line paragraphs. Never renders HTML from the database. */
export function Paragraphs({ text }: { text: string }) {
  return <div className="prose-plain">{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>;
}
