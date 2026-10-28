'use client';

import { useCallback, useEffect, useState } from 'react';

let deferredPrompt: ((e: Event) => void) | null = null;
let promptEvent: Event | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptEvent = e;
    window.dispatchEvent(new Event('veyro:install-available'));
  });
  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    window.dispatchEvent(new Event('veyro:install-unavailable'));
  });
}

export function useInstall(): { canInstall: boolean; install: () => Promise<boolean> } {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const sync = () => setCanInstall(Boolean(promptEvent));
    sync();
    window.addEventListener('veyro:install-available', sync);
    window.addEventListener('veyro:install-unavailable', sync);
    return () => {
      window.removeEventListener('veyro:install-available', sync);
      window.removeEventListener('veyro:install-unavailable', sync);
    };
  }, []);

  const install = useCallback(async () => {
    const event = promptEvent as Event | null;
    if (!event) return false;
    const promptEvt = event as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    promptEvt.prompt();
    await promptEvt.userChoice;
    promptEvent = null;
    setCanInstall(false);
    return true;
  }, []);

  return { canInstall, install };
}

export function PwaRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — offline shell simply won't be available.
      });
    }
    return () => {
      // no-op
    };
  }, []);

  return null;
}

export function InstallButton() {
  const { canInstall, install } = useInstall();

  if (!canInstall) return null;

  return (
    <button
      onClick={async () => {
        const ok = await install();
        if (!ok) {
          window.dispatchEvent(new Event('veyro:install-unavailable'));
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-raised"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      Install app
    </button>
  );
}
