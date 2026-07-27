import type { MetadataRoute } from "next";

import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { tryCreateServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { absoluteUrl } from "@/shared/seo/metadata";
import { SITE_URL } from "@/shared/constants/site";

const PUBLIC_PATHS = [
  "/",
  "/etkinlikler",
  "/hakkimizda",
  "/galeri",
  "/iletisim",
  "/veli-rehberi",
  "/kurumsal-talep",
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
    const galleryRepository = new SupabaseGalleryRepository(client);
    const eventRepository = new SupabaseEventRepository(client);

    const [albums, events] = await Promise.all([
      galleryRepository.listPublishedAlbums(),
      eventRepository.listPublishedSlugs(),
    ]);

    const albumEntries: MetadataRoute.Sitemap = albums.map((album) => ({
      url: absoluteUrl(`/galeri/${album.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
      url: absoluteUrl(`/etkinlikler/${event.slug}`),
      lastModified: event.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticEntries, ...albumEntries, ...eventEntries];
  } catch {
    return staticEntries;
  }
}
