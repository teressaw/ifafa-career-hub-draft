import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export const metadata: Metadata = {
  title: { default: 'IFAFA Career Hub — Returnships and career pathways in Ireland', template: '%s · IFAFA Career Hub' },
  description: 'A volunteer-verified directory of returnships, career re-entry programmes and employment pathways in Ireland for accompanying partners of Irish diplomatic staff.',
};

export const viewport: Viewport = { themeColor: '#126342', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IE">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-50 rounded-full bg-forest px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
