import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/pwa';
import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/lib/hooks/use-theme';

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? vercelUrl ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Ascned - Focus, simplified', template: '%s - Ascned' },
  description: 'Ascned is a calm productivity workspace for tasks, habits, goals and deep work.',
  applicationName: 'Ascned',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Ascned',
    title: 'Ascned - Focus, simplified',
    description: 'A calm productivity workspace for tasks, habits, goals and deep work.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ascned - Focus, simplified',
    description: 'A calm productivity workspace for tasks, habits, goals and deep work.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#121212" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ascned" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var stored = null;
    try { stored = localStorage.getItem('ascned-theme') || localStorage.getItem('veyro-theme'); } catch (e) {}
    if (!stored) {
      var match =
        document.cookie.match(/(?:^|; )ascned-theme=([^;]*)/) ||
        document.cookie.match(/(?:^|; )veyro-theme=([^;]*)/);
      if (match) {
        try { stored = decodeURIComponent(match[1]); } catch (e) { stored = match[1]; }
      }
    }
    var theme = stored === 'light' ? 'light' : 'midnight';
    var root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.remove('dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F6F2' : '#121212');
    requestAnimationFrame(function () { root.classList.add('theme-ready'); });
  } catch (e) {}
})();
`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PwaRegistrar />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
