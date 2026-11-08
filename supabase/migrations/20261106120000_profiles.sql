-- Ascned profiles: unique usernames, avatars, and onboarding support.
-- Safe to re-run: only creates missing objects and recreates its own policies.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
--   DROP FUNCTION IF EXISTS public.touch_profile_updated_at();
--   DROP FUNCTION IF EXISTS public.username_available(TEXT, UUID);
--   DROP TABLE IF EXISTS public.profiles;
--   DELETE FROM storage.objects WHERE bucket_id = 'avatars';
--   DELETE FROM storage.buckets WHERE id = 'avatars';

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (LOWER(username));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE OR REPLACE FUNCTION public.username_available(candidate TEXT, exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN candidate IS NULL OR candidate !~ '^[A-Za-z0-9_]{3,20}$' THEN FALSE
    ELSE NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE LOWER(username) = LOWER(candidate)
        AND (exclude_id IS NULL OR id <> exclude_id)
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.username_available(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.username_available(TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.username_available(TEXT, UUID) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users manage own avatar images" ON storage.objects;
CREATE POLICY "Users manage own avatar images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
