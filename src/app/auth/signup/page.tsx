'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';
import GoogleButton from '@/components/auth/GoogleButton';

export default function SignupPage() {
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">Veyro</Link>
          <p className="mt-2 text-sm text-muted">Start your productivity journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">Email</label>
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
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">Password</label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleButton />

        <div className="mt-6 text-center text-sm text-muted">
          <Link href="/auth/login" className="text-text hover:underline">Already have an account? Sign in</Link>
        </div>
      </Card>
    </div>
  );
}