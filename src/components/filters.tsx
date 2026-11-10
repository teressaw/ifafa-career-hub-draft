import Link from 'next/link';
import { FILTERS, SORTS, activeFilterCount, queryHref, type FilterKey, type Query } from '@/lib/filters';
import { AutoSubmit } from './auto-submit';

function Select({ name, label, options, value }: { name: string; label: string; options: Record<string, string>; value: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="field-label">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={value} className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%235a665f%22 stroke-width=%221.6%22/></svg>')] bg-[right_14px_center] bg-no-repeat pr-10">
        <option value="">Any</option>
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

/** A plain GET form: works without JavaScript, and every result page has a shareable URL. */
export function FilterForm({ q }: { q: Query }) {
  const count = activeFilterCount(q);
  const fields = (
    <div className="space-y-4">
      {(Object.keys(FILTERS) as FilterKey[]).map(k => <Select key={k} name={k} label={FILTERS[k].label} options={FILTERS[k].options} value={q[k]} />)}
      <Select name="sort" label="Sort by" options={SORTS} value={q.sort === 'relevance' ? '' : q.sort} />
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">Show results</button>
        {count > 0 && <Link href={queryHref(q, { sector: '', region: '', arrangement: '', type: '', careerBreak: '', status: '' })} className="btn-secondary">Clear filters</Link>}
      </div>
    </div>
  );
  return (
    <form action="/opportunities" method="get" role="search" aria-label="Search and filter opportunities" id="filters">
      <AutoSubmit />
      <label htmlFor="q" className="sr-only">Search opportunities</label>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">⌕</span>
        <input id="q" name="q" type="search" defaultValue={q.q} placeholder="Search by employer, role or keyword" className="field rounded-full pl-10" maxLength={100} />
      </div>
      {/* One set of fields. On small screens a checkbox toggle reveals them (works without JavaScript); always shown on large screens. */}
      <input type="checkbox" id="show-filters" className="peer sr-only" aria-controls="filter-fields" />
      <label htmlFor="show-filters" className="card mt-4 flex min-h-12 cursor-pointer items-center justify-between px-4 font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-gold lg:hidden">
        <span>Show filters{count ? ` (${count} active)` : ''}</span><span aria-hidden="true" className="text-muted">▾</span>
      </label>
      <div id="filter-fields" className="card mt-2 hidden p-4 peer-checked:block lg:mt-6 lg:block lg:border-0 lg:bg-transparent lg:p-0">{fields}</div>
    </form>
  );
}

export function ActiveFilters({ q }: { q: Query }) {
  const chips = (Object.keys(FILTERS) as FilterKey[]).filter(k => q[k]).map(k => ({ k, text: (FILTERS[k].options as Record<string, string>)[q[k]] }));
  if (!chips.length && !q.q) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {q.q && <li><Link href={queryHref(q, { q: '' })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-forest/30 bg-mint px-3 text-sm font-medium text-forest hover:bg-white">“{q.q}” <span aria-hidden="true">×</span><span className="sr-only">Remove search</span></Link></li>}
      {chips.map(c => (
        <li key={c.k}><Link href={queryHref(q, { [c.k]: '' })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-forest/30 bg-mint px-3 text-sm font-medium text-forest hover:bg-white">{c.text} <span aria-hidden="true">×</span><span className="sr-only">Remove filter</span></Link></li>
      ))}
    </ul>
  );
}
