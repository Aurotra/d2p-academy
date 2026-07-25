import type { MetadataRoute } from "next";

import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { absoluteUrl } from "@/shared/seo/metadata";
import { SITE_URL } from "@/shared/constants/site";

const PUBLIC_PATHS = [
  "/",
  "/galeri",
  "/iletisim",
  "/veli-rehberi",
  "/kurumsal-talep",
  "/kayit",
  "/kvkk",
  "/gizlilik",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const client = await createSupabaseServerClient();
    if (!client) {
      return staticEntries;
    }

    const albums = await new SupabaseGalleryRepository(client).listPublishedAlbums();
    const albumEntries: MetadataRoute.Sitemap = albums.map((album) => ({
      url: absoluteUrl(`/galeri/${album.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticEntries, ...albumEntries];
  } catch {
    return staticEntries;
  }
}
