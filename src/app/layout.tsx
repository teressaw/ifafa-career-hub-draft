import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/source-sans-3/wght.css';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Workbreak — Return to paid work in Ireland', template: '%s · Workbreak' },
  description: 'Find returnships and other ways back into paid work in Ireland, and help employers build better return-to-work pathways. Life isn’t a career break.',
  applicationName: 'Workbreak',
  openGraph: {
    type: 'website',
    siteName: 'Workbreak',
    locale: 'en_IE',
    title: 'Workbreak — Life isn’t a career break.',
    description: 'Opportunities to return to paid work in Ireland, and practical tools for employers creating ways back.',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#f6f0e7', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IE">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-50 rounded-full bg-olive px-4 py-2 font-semibold text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
