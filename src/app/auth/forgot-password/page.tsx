'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">Veyro</Link>
          <p className="mt-2 text-sm text-muted">Reset your password</p>
        </div>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-text">
              If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a password reset link.
            </p>
            <p className="text-sm text-muted">Check your inbox and follow the link to choose a new password.</p>
            <Link href="/auth/login" className="inline-block text-sm font-medium text-text underline">Back to sign in</Link>
          </div>
        ) : (
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center text-sm text-muted">
          <Link href="/auth/login" className="text-text hover:underline">Back to sign in</Link>
        </div>
      </Card>
    </div>
  );
}