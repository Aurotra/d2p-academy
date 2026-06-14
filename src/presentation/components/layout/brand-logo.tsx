import Link from "next/link";

import {
  SITE_LOGO_HEIGHT,
  SITE_LOGO_SRC,
  SITE_LOGO_WIDTH,
  SITE_NAME,
} from "@/shared/constants/site";

interface BrandLogoProps {
  href?: string;
  className?: string;
  /** Max logo height in pixels; width scales automatically. */
  height?: number;
}

export function BrandLogo({ href = "/", className = "", height = 40 }: BrandLogoProps) {
  const logo = (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <img
        src={SITE_LOGO_SRC}
        alt={SITE_NAME}
        width={SITE_LOGO_WIDTH}
        height={SITE_LOGO_HEIGHT}
        className="block w-auto object-contain"
        style={{ height: `${height}px`, maxHeight: `${height}px`, width: "auto" }}
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
