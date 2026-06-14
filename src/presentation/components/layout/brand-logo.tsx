import Link from "next/link";

import { SITE_LOGO_SRC, SITE_NAME } from "@/shared/constants/site";

interface BrandLogoProps {
  href?: string;
  className?: string;
  /** Max logo height in pixels; width follows the SVG aspect ratio. */
  height?: number;
}

export function BrandLogo({ href = "/", className = "", height = 48 }: BrandLogoProps) {
  const logo = (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <img
        src={SITE_LOGO_SRC}
        alt={SITE_NAME}
        className="block w-auto max-w-none object-contain object-left"
        style={{ height: `${height}px`, maxHeight: `${height}px`, width: "auto" }}
        decoding="async"
      />
    </span>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center self-center">
      {logo}
    </Link>
  );
}
