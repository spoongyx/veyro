'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { clearOfflineData } from '@/lib/offline';
import { authCallbackUrl } from '@/lib/utils/auth-redirect';
import type { Profile, User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | null): Promise<Profile | null> => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    const next = !error && data ? (data as Profile) : null;
    setProfile(next);
    setProfileLoading(false);
    return next;
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = (data.session?.user as User) ?? null;
      setUser(sessionUser);
      setLoading(false);
      void loadProfile(sessionUser?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = (session?.user as User) ?? null;
      setUser(sessionUser);
      setLoading(false);
      void loadProfile(sessionUser?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authCallbackUrl() },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearOfflineData();
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await window.caches.keys();
        await Promise.all(
          keys.filter((key) => key.startsWith('veyro-')).map((key) => window.caches.delete(key))
        );
      } catch {
        // Cache Storage unavailable — nothing to clear.
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser((data.user as User) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    return loadProfile(user?.id ?? null);
  }, [loadProfile, user?.id]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authCallbackUrl() },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackUrl('/auth/reset-password'),
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      refreshProfile,
      signInWithGoogle,
      resetPassword,
    }),
    [
      user,
      profile,
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      refreshProfile,
      signInWithGoogle,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}