import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-barlow',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YourBarber',
  description: 'Barbershop client management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'YourBarber',
  },
  other: {
    // Next's appleWebApp.capable only emits the legacy apple-mobile-web-app-capable
    // tag (still needed for older iOS Safari). Chrome/Android want the standardised
    // mobile-web-app-capable tag too, or it logs a deprecation warning on every page.
    'mobile-web-app-capable': 'yes',
  },
};

import { DemoOverrideProvider } from '@/components/DemoOverrideProvider';
import Providers from '@/components/Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <DemoOverrideProvider>
            {children}
          </DemoOverrideProvider>
        </Providers>
      </body>
    </html>
  );
}
