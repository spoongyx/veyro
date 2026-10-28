import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme/ThemeSwitcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeToggle className="fixed right-4 top-4 z-50" />
      {children}
    </>
  );
}
