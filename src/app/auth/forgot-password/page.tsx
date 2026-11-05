'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';
import AuthShell from '@/components/auth/AuthShell';

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
    <AuthShell
      subtitle="Reset your password."
      footer={
        <Link href="/auth/login" className="font-medium text-text transition-colors hover:text-accent">
          Back to sign in
        </Link>
      }
    >
      <Card className="p-6 sm:p-8">
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-6 text-text">
              If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a password
              reset link.
            </p>
            <p className="text-sm leading-6 text-muted">
              Check your inbox and follow the link to choose a new password.
            </p>
            <Link href="/auth/login" className="inline-block text-sm font-medium text-accent hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
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
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}
