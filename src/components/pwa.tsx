'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Check,
  Download,
  EllipsisVertical,
  Laptop,
  Share,
  Smartphone,
  SquarePlus,
} from 'lucide-react';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Platform = 'ios' | 'android' | 'desktop';

let promptEvent: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptEvent = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event('ascned:install-available'));
  });
  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    window.dispatchEvent(new Event('ascned:install-unavailable'));
  });
}

export function useInstall(): { canInstall: boolean; install: () => Promise<boolean> } {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const sync = () => setCanInstall(Boolean(promptEvent));
    sync();
    window.addEventListener('ascned:install-available', sync);
    window.addEventListener('ascned:install-unavailable', sync);
    return () => {
      window.removeEventListener('ascned:install-available', sync);
      window.removeEventListener('ascned:install-unavailable', sync);
    };
  }, []);

  const install = useCallback(async () => {
    const event = promptEvent;
    if (!event) return false;
    promptEvent = null;
    setCanInstall(false);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome !== 'accepted') {
        window.dispatchEvent(new Event('ascned:install-unavailable'));
      }
      return choice.outcome === 'accepted';
    } catch {
      window.dispatchEvent(new Event('ascned:install-unavailable'));
      return false;
    }
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

function InstructionStep({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-line bg-surface/50 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
        {index}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <span aria-hidden="true">{icon}</span>
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{body}</p>
      </div>
    </li>
  );
}

function InstallInstructions({ platform }: { platform: Platform }) {
  if (platform === 'ios') {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted">
          Apple requires one manual step. Open Ascned in Safari, then:
        </p>
        <ol className="space-y-2.5">
          <InstructionStep
            index={1}
            icon={<Share size={15} />}
            title="Tap Share"
            body="Tap the Share button in Safari's toolbar."
          />
          <InstructionStep
            index={2}
            icon={<SquarePlus size={15} />}
            title="Add to Home Screen"
            body="Scroll the share sheet and choose Add to Home Screen."
          />
          <InstructionStep
            index={3}
            icon={<Check size={15} />}
            title="Tap Add"
            body="Ascned will appear on your home screen like a native app."
          />
        </ol>
        <p className="rounded-xl border border-line bg-surface/60 p-3 text-xs leading-5 text-muted">
          iOS does not allow websites to install themselves automatically. This is the only step Safari
          requires.
        </p>
      </div>
    );
  }

  if (platform === 'android') {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted">
          Your browser did not offer the one-tap install prompt. In Chrome, use the menu:
        </p>
        <ol className="space-y-2.5">
          <InstructionStep
            index={1}
            icon={<EllipsisVertical size={15} />}
            title="Open the menu"
            body="Tap the three-dot menu in Chrome."
          />
          <InstructionStep
            index={2}
            icon={<Download size={15} />}
            title="Install app"
            body="Choose Install app or Add to Home screen."
          />
          <InstructionStep
            index={3}
            icon={<Check size={15} />}
            title="Confirm"
            body="Tap Install. Ascned opens full-screen like an app."
          />
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Use Chrome or Edge for a one-click install on desktop. On mobile, open Ascned in Chrome or
        Safari.
      </p>
      <ol className="space-y-2.5">
        <InstructionStep
          index={1}
          icon={<Laptop size={15} />}
          title="Use a supported browser"
          body="Chrome, Edge, or Safari on desktop."
        />
        <InstructionStep
          index={2}
          icon={<Download size={15} />}
          title="Install Ascned"
          body="Click the install icon in the address bar, or open the browser menu and choose Install Ascned."
        />
        <InstructionStep
          index={3}
          icon={<Smartphone size={15} />}
          title="On mobile"
          body="Open the site in Chrome or Safari, then use Add to Home screen."
        />
      </ol>
    </div>
  );
}

export function DownloadAppButton({
  className,
  label = 'Download app',
}: {
  className?: string;
  label?: string;
}) {
  const { canInstall, install } = useInstall();
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIpad =
      window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
    if (/iPad|iPhone|iPod/.test(ua) || isIpad) {
      setPlatform('ios');
    } else if (/Android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const handleClick = async () => {
    if (installed) return;
    if (canInstall) {
      const accepted = await install();
      if (accepted) return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={installed}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-raised disabled:cursor-default disabled:opacity-70',
          className
        )}
      >
        {installed ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Download size={16} aria-hidden="true" />
        )}
        {installed ? 'App installed' : label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Install Ascned"
        description="Add Ascned to your home screen for a full-screen, app-like experience."
      >
        <InstallInstructions platform={platform} />
      </Modal>
    </>
  );
}
