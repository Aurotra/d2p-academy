import Image, { type ImageProps } from "next/image";

export { isUnusableGalleryAlt, resolveGalleryPhotoAlt } from "@/shared/utils/gallery-photo-alt";

function shouldBypassOptimizer(src: string): boolean {
  if (src.startsWith("/") && src.toLowerCase().endsWith(".svg")) {
    return true;
  }

  try {
    const url = new URL(src);
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.includes("/storage/v1/object/sign/")
    );
  } catch {
    return false;
  }
}

type RemoteImageProps = Omit<ImageProps, "src" | "unoptimized"> & {
  src: string;
};

/** next/image wrapper that skips the optimizer for SVG logos and Supabase signed URLs. */
export function RemoteImage({ src, ...props }: RemoteImageProps) {
  return <Image src={src} unoptimized={shouldBypassOptimizer(src)} {...props} />;
}
