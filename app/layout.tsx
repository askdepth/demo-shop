// File: app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CartProvider } from '@/components/cart-provider';
import { Toaster } from '@/components/ui/toaster';
import { DemoLabDrawer } from '@/components/demo/demo-lab-drawer';
import { getAppUrl } from '@/lib/app-url';
import { DemoBanner } from '@/components/store/demo-banner';
import { SITE_NAME } from '@/lib/site';
import { getCategoryTree } from '@/server/queries/catalog';
import {
  normalizeEnvironment,
  normalizeTelemetryEndpoint,
} from '@/lib/askdepth-config';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Fictional demo e-commerce store: shop thousands of products, deals and more.',
  keywords: ['ecommerce', 'store', 'shopping', 'demo'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  metadataBase: new URL(getAppUrl()),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: SITE_NAME,
    description: 'Fictional demo e-commerce store',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Fictional demo e-commerce store',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getCategoryTree().catch(() => []);
  const categories = tree.map(c => ({ name: c.name, slug: c.slug }));

  // Pass runtime env down from dynamic Server Component so App Hosting RUNTIME secrets
  // activate AskDepth SDK even without baking NEXT_PUBLIC_* into the Docker layer.
  const initialAskdepthConfig = {
    writeKey: process.env.NEXT_PUBLIC_ASKDEPTH_WRITE_KEY || '',
    endpoint: normalizeTelemetryEndpoint(
      process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT ||
        process.env.ASKDEPTH_INGEST_URL
    ),
    buildId: process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID || 'demo-shop-v1',
    environment: normalizeEnvironment(
      process.env.NEXT_PUBLIC_ASKDEPTH_ENVIRONMENT
    ),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialAskdepthConfig={initialAskdepthConfig}>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <DemoBanner />
              <Header siteName={SITE_NAME} categories={categories} />
              <main className="flex-1">{children}</main>
              <Footer siteName={SITE_NAME} categories={categories} />
            </div>
            <Toaster />
            <DemoLabDrawer />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
