/**
 * Extracts the object path inside the Supabase `gallery` bucket from a stored URL.
 */
export function extractGalleryStoragePath(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }

  const publicMatch = url.match(/\/storage\/v1\/object\/public\/gallery\/([^?]+)/);
  if (publicMatch?.[1]) {
    return decodeURIComponent(publicMatch[1]);
  }

  const signedMatch = url.match(/\/storage\/v1\/object\/sign\/gallery\/([^?]+)/);
  if (signedMatch?.[1]) {
    return decodeURIComponent(signedMatch[1]);
  }

  return null;
}
