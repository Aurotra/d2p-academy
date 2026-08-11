import { describe, expect, it } from "vitest";

import {
  isUnusableGalleryAlt,
  resolveGalleryPhotoAlt,
} from "@/shared/utils/gallery-photo-alt";

describe("isUnusableGalleryAlt", () => {
  it("rejects WhatsApp and camera-style filenames", () => {
    expect(isUnusableGalleryAlt("WhatsApp Image 2026-07-26 at 14.22.01")).toBe(true);
    expect(isUnusableGalleryAlt("IMG_1234")).toBe(true);
    expect(isUnusableGalleryAlt("DSC_0001")).toBe(true);
    expect(isUnusableGalleryAlt("Screenshot 2026-07-26")).toBe(true);
    expect(isUnusableGalleryAlt("2026-07-26")).toBe(true);
    expect(isUnusableGalleryAlt("42")).toBe(true);
    expect(isUnusableGalleryAlt("")).toBe(true);
  });

  it("keeps descriptive Turkish alt text", () => {
    expect(
      isUnusableGalleryAlt("Denizli Honaz'da çocuklar için 3D tasarım ve baskı atölyesi"),
    ).toBe(false);
  });
});

describe("resolveGalleryPhotoAlt", () => {
  it("falls back to album title when alt looks like a filename", () => {
    expect(
      resolveGalleryPhotoAlt({
        altText: "WhatsApp Image 2026-07-26 at 14.22.01",
        albumTitle: "Kaklık Yaz Kursu",
      }),
    ).toBe("Kaklık Yaz Kursu — Denizli D2P Academy atölye fotoğrafı");
  });

  it("prefers usable alt text", () => {
    expect(
      resolveGalleryPhotoAlt({
        altText: "Öğrenciler 3D yazıcı başında",
        albumTitle: "Kaklık Yaz Kursu",
      }),
    ).toBe("Öğrenciler 3D yazıcı başında");
  });
});
