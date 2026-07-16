import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { GalleryHomeSlider } from "@/presentation/components/home/gallery-home-slider";

async function getHomePhotos() {
  const client = await createSupabaseServerClient();
  if (!client) return [];

  try {
    return await new SupabaseGalleryRepository(client).listRecentHomePhotos(10);
  } catch {
    return [];
  }
}

export async function GalleryHomePreview() {
  const photos = await getHomePhotos();

  if (photos.length === 0) {
    return null;
  }

  return <GalleryHomeSlider photos={photos} />;
}
