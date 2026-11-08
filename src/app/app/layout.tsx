import { PwaRegistrar } from '@/components/pwa';
import AppShell from '@/components/layout';
import ReminderWatcher from '@/components/reminder-watcher';
import { AuthProvider } from '@/lib/hooks/use-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReminderWatcher />
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}

export const metadata = {
  title: 'Ascned',
};
