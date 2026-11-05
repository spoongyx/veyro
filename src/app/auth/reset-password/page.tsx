'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';
import AuthShell from '@/components/auth/AuthShell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      void supabase.auth.exchangeCodeForSession(code).then(({ error: exErr }) => {
        if (exErr) {
          setError(exErr.message);
          return;
        }
        setReady(true);
      });
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        return;
      }
      setError('This reset link is invalid or has expired.');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <AuthShell
      subtitle="Choose a new password."
      footer={
        <Link href="/auth/login" className="font-medium text-text transition-colors hover:text-accent">
          Back to sign in
        </Link>
      }
    >
      <Card className="p-6 sm:p-8">
        {!ready ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted">{error ?? 'Verifying reset link...'}</p>
            {error ? (
              <Link href="/auth/forgot-password" className="inline-block text-sm font-medium text-accent hover:underline">
                Request a new link
              </Link>
            ) : null}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            )}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
                New password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-text">
                Confirm new password
              </label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}
