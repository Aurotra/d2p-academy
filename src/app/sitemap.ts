import type { MetadataRoute } from "next";

import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
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

export const revalidate = 3600;

function buildStaticEntries(now: Date): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = buildStaticEntries(now);

  const client = tryCreateServiceRoleClient();
  if (!client) {
    return staticEntries;
  }

  try {
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
