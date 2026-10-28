import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/pwa';
import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/lib/hooks/use-theme';

export const metadata: Metadata = {
  title: { default: 'Veyro - Focus, simplified', template: '%s - Veyro' },
  description: 'Veyro is a calm productivity workspace for tasks, habits, goals and deep work.',
  manifest: '/manifest.webmanifest',
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
        <meta name="description" content="Veyro - a calm productivity workspace" />
        <meta name="theme-color" content="#05070E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Veyro" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var stored = null;
    try { stored = localStorage.getItem('veyro-theme'); } catch (e) {}
    if (!stored) {
      var match = document.cookie.match(/(?:^|; )veyro-theme=([^;]*)/);
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
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F6F2' : '#05070E');
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
