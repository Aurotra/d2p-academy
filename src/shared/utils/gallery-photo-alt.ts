/**
 * Detects alt text that came from phone/camera filenames (WhatsApp, IMG_, etc.)
 * and should not be shown publicly for SEO/accessibility.
 */
export function isUnusableGalleryAlt(value: string | null | undefined): boolean {
  const alt = value?.trim() ?? "";
  if (!alt) {
    return true;
  }

  if (/^\d+$/.test(alt)) {
    return true;
  }

  const normalized = alt.toLowerCase().replace(/\s+/g, " ");

  return (
    /whatsapp\s*image/i.test(normalized) ||
    /^img[_\s-]?\d+/i.test(normalized) ||
    /^dsc[_\s-]?\d+/i.test(normalized) ||
    /^dscn?\d+/i.test(normalized) ||
    /^pxl[_\s-]?\d+/i.test(normalized) ||
    /^screenshot/i.test(normalized) ||
    /^photo[_\s-]?\d+/i.test(normalized) ||
    /^image[_\s-]?\d+/i.test(normalized) ||
    /^file[_\s-]?\d+/i.test(normalized) ||
    /^\d{4}[-_]\d{2}[-_]\d{2}/.test(normalized)
  );
}

export function resolveGalleryPhotoAlt(input: {
  altText?: string | null;
  caption?: string | null;
  albumTitle: string;
}): string {
  const alt = input.altText?.trim();
  if (alt && !isUnusableGalleryAlt(alt)) {
    return alt;
  }

  const caption = input.caption?.trim();
  if (caption && !isUnusableGalleryAlt(caption)) {
    return caption;
  }

  return `${input.albumTitle} — Denizli D2P Academy atölye fotoğrafı`;
}
