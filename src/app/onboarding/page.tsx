'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AtSign, Camera, LogOut } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { UsernameStatusLine } from '@/components/profile/UsernameStatusLine';
import { Avatar, Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUsernameAvailability } from '@/lib/hooks/use-username-availability';
import {
  USERNAME_MAX_LENGTH,
  normalizeUsername,
  uploadAvatar,
  validateAvatarFile,
  validateUsername,
} from '@/lib/profile';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, profileLoading, refreshProfile, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilled = useRef(false);

  const availability = useUsernameAvailability(username);
  const usernameProblem = validateUsername(username);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) router.replace('/app/dashboard');
  }, [loading, profileLoading, user, profile, router]);

  useEffect(() => {
    if (prefilled.current || !user) return;
    prefilled.current = true;
    const local = user.email?.split('@')[0] ?? '';
    const suggestion = local
      .replace(/[^A-Za-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, USERNAME_MAX_LENGTH);
    if (validateUsername(suggestion) === null) setUsername(suggestion);
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setAvatarFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const clean = normalizeUsername(username);
    const problem = validateUsername(clean);
    if (problem) {
      setError(problem);
      return;
    }
    if (availability === 'taken') {
      setError('That username is already taken. Try another one.');
      return;
    }
    if (availability === 'checking') {
      setError('Hang on while we check that username.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      let avatarUrl: string | null = null;

      if (avatarFile) {
        const upload = await uploadAvatar(supabase, user.id, avatarFile);
        if (upload.error || !upload.url) {
          setError(upload.error ?? 'Could not upload your picture. Try again.');
          return;
        }
        avatarUrl = upload.url;
      }

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: clean, avatar_url: avatarUrl }, { onConflict: 'id' });

      if (saveError) {
        setError(
          saveError.code === '23505'
            ? 'That username is already taken. Try another one.'
            : saveError.message
        );
        return;
      }

      await refreshProfile();
      router.replace('/app/dashboard');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
    router.refresh();
  };

  if (loading || profileLoading) {
    return (
      <AuthShell subtitle="Getting your workspace ready.">
        <Card className="space-y-4 p-6 sm:p-8">
          <div className="mx-auto skeleton h-24 w-24 rounded-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-12 w-full" />
        </Card>
      </AuthShell>
    );
  }

  const displayName = username.trim() || user?.email;

  return (
    <AuthShell
      subtitle="One last step to make Veyro yours."
      footer={
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
        >
          <LogOut size={13} /> Sign out
        </button>
      }
    >
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={displayName} email={user?.email} src={avatarPreview} className="h-24 w-24 text-2xl" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={15} /> {avatarPreview ? 'Change picture' : 'Add a picture'}
            </Button>
            <p className="text-[11px] text-muted">Optional - square images look best.</p>
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text">
              Username
            </label>
            <div className="relative">
              <AtSign
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                id="username"
                autoComplete="username"
                spellCheck={false}
                maxLength={USERNAME_MAX_LENGTH}
                placeholder="yourname"
                className="pl-9"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <UsernameStatusLine status={availability} />
          </div>

          {error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            loading={saving}
            disabled={
              saving ||
              !username.trim() ||
              Boolean(usernameProblem) ||
              availability === 'checking' ||
              availability === 'taken'
            }
          >
            Continue to Veyro
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
