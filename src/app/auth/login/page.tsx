'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';
import GoogleButton from '@/components/auth/GoogleButton';
import AuthShell from '@/components/auth/AuthShell';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push('/app/dashboard');
    router.refresh();
  };

  return (
    <AuthShell
      subtitle="Welcome back. Let's get focused."
      footer={
        <>
          <Link href="/auth/signup" className="font-medium text-text transition-colors hover:text-accent">
            Create an account
          </Link>
          <span className="mx-2 text-line">·</span>
          <Link href="/" className="transition-colors hover:text-text">
            Back to home
          </Link>
        </>
      }
    >
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-text">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-muted transition-colors hover:text-accent"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleButton />
      </Card>
    </AuthShell>
  );
}
