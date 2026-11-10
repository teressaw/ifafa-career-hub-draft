import type { Metadata } from 'next';
import { ResourcePage } from '@/components/resource-page';

export const metadata: Metadata = { title: 'Events' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: PageProps<'/events'>) {
  return <ResourcePage kind="event" rawPath={(await searchParams).path} />;
}
