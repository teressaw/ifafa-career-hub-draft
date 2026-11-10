import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Volunteer area', robots: { index: false, follow: false } };
export default function AdminRoot({ children }: LayoutProps<'/admin'>) { return children; }
