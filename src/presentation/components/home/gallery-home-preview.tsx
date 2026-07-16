import type { GalleryHomePhoto } from "@/core/domain/gallery";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { GalleryHomeSlider } from "@/presentation/components/home/gallery-home-slider";

const FEATURED_HOME_PHOTO: GalleryHomePhoto = {
  id: "featured-workshop-honaz",
  imageUrl: "/home/workshop-honaz.png",
  thumbUrl: "/home/workshop-honaz.png",
  altText: "D2P Academy atölye salonu",
  albumTitle: "Atölye",
  albumSlug: "",
  locationName: null,
};

async function getHomePhotos() {
  const client = await createSupabaseServerClient();
  if (!client) return [FEATURED_HOME_PHOTO];

  try {
    const photos = await new SupabaseGalleryRepository(client).listRecentHomePhotos(10);
    const withoutDuplicateFeatured = photos.filter(
      (photo) => !photo.imageUrl.includes("workshop-honaz"),
    );
    return [FEATURED_HOME_PHOTO, ...withoutDuplicateFeatured].slice(0, 12);
  } catch {
    return [FEATURED_HOME_PHOTO];
  }
}

export async function GalleryHomePreview() {
  const photos = await getHomePhotos();
  return <GalleryHomeSlider photos={photos} />;
}
