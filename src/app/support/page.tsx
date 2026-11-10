import type { Metadata } from 'next';
import { ResourcePage } from '@/components/resource-page';

export const metadata: Metadata = { title: 'Career support' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: PageProps<'/support'>) {
  return <ResourcePage kind="support" rawPath={(await searchParams).path} />;
}
