import Link from 'next/link';
import type { ReactNode } from 'react';

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen min-h-dvh bg-ink text-text">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6">
        <Link href="/" aria-label="Veyro home" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast"
          >
            V
          </span>
          <span className="text-xl font-bold tracking-tight">Veyro</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-muted transition-colors hover:text-text">
          Back to home
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: November 5, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-6 text-muted [&_a]:text-accent [&_a:hover]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text [&_li]:mt-1 [&_p]:mt-2 [&_strong]:font-semibold [&_strong]:text-text [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 text-sm text-muted sm:flex-row sm:px-6">
          <p>Veyro</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-text">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text">
              Terms
            </Link>
            <a
              href="https://github.com/spoongyx/veyro/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-text"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
