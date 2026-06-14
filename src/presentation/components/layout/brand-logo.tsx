import Image from "next/image";
import Link from "next/link";

/** Intrinsic dimensions of public/d2plogo.png — used only for Next.js layout hints. */
const LOGO_WIDTH = 320;
const LOGO_HEIGHT = 120;

interface BrandLogoProps {
  href?: string;
  className?: string;
  /** Max logo height in pixels; width scales automatically. */
  height?: number;
}

export function BrandLogo({ href = "/", className = "", height = 40 }: BrandLogoProps) {
  const logo = (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/d2plogo.png"
        alt="D2P Academy"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="w-auto object-contain"
        style={{ height: `${height}px`, width: "auto", maxHeight: `${height}px` }}
        priority
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
