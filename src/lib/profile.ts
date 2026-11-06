import type { SupabaseClient } from '@supabase/supabase-js';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const USERNAME_HINT = '3-20 characters using letters, numbers, or underscores.';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 512;

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);
  if (!username) return 'Choose a username.';
  if (!USERNAME_PATTERN.test(username)) return USERNAME_HINT;
  return null;
}

export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Choose an image file.';
  if (file.size > MAX_AVATAR_BYTES) return 'Keep the image under 5 MB.';
  return null;
}

async function resizeAvatar(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not read that image.'));
      element.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the image.');

    const edge = Math.min(image.width, image.height);
    const offsetX = (image.width - edge) / 2;
    const offsetY = (image.height - edge) / 2;
    context.drawImage(image, offsetX, offsetY, edge, edge, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the image.'))),
        'image/jpeg',
        0.9
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const problem = validateAvatarFile(file);
  if (problem) return { url: null, error: problem };

  try {
    const blob = await resizeAvatar(file);
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { url: `${data.publicUrl}?v=${Date.now()}`, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Could not prepare the image.',
    };
  }
}
