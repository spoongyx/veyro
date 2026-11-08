import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark, BrandVersion } from '@/components/brand';

export default function AuthShell({
  subtitle,
  children,
  footer,
}: {
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-ink px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 right-[-10%] h-[440px] w-[440px] rounded-full bg-accent/[0.09] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 left-[-10%] h-[380px] w-[380px] rounded-full bg-accent/[0.05] blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" aria-label="Ascned home" className="group flex items-center gap-2.5">
            <BrandMark
              className="h-10 w-10 transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="flex items-center gap-1.5">
              <span className="text-xl font-semibold tracking-tight text-text">Ascned</span>
              <BrandVersion />
            </span>
          </Link>
          <p className="mt-3 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
