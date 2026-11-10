import { requireVolunteer } from '@/lib/auth';
import { ImportTool } from '@/components/admin/import-tool';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function ImportPage({ searchParams }: PageProps<'/admin/import'>) {
  await requireVolunteer();
  const url = (await searchParams).url;
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="font-serif text-3xl font-semibold">Import from a link</h1>
      <p className="mt-2 text-ink-soft">Paste the address of an official job or programme page. The hub reads it once and pre-fills a draft with whatever the page states — each field shows exactly where it came from, and anything the page doesn’t say is left empty.</p>
      <div className="mt-8"><ImportTool initialUrl={typeof url === 'string' ? url : ''} /></div>
    </div>
  );
}
