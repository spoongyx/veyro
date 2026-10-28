'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, Input } from '@/components/ui';

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
    if (!code) return;
    void supabase.auth.exchangeCodeForSession(code).then(({ error: exErr }) => {
      if (exErr) {
        setError(exErr.message);
        return;
      }
      setReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">Veyro</Link>
          <p className="mt-2 text-sm text-muted">Choose a new password</p>
        </div>
        {!ready ? (
          <div className="py-6 text-center text-sm text-muted">Verifying reset link...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">New password</label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-text">Confirm new password</label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating password...' : 'Update password'}
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