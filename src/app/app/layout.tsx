import { PwaRegistrar } from '@/components/pwa';
import AppShell from '@/components/layout';
import { AuthProvider } from '@/lib/hooks/use-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}

export const metadata = {
  title: 'Veyro',
};
