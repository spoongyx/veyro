import { AuthProvider } from '@/lib/hooks/use-auth';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export const metadata = {
  title: 'Welcome · Veyro',
};
