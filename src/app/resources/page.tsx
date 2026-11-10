import type { Metadata } from 'next';
import { ResourcePage } from '@/components/resource-page';

export const metadata: Metadata = { title: 'Practical resources' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: PageProps<'/resources'>) {
  return <ResourcePage kind="resource" rawPath={(await searchParams).path} />;
}
