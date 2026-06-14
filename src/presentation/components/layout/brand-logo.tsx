import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  className?: string;
  height?: number;
}

export function BrandLogo({ href = "/", className = "", height = 44 }: BrandLogoProps) {
  const logo = (
    <Image
      src="/d2p-logo.svg"
      alt="D2P Academy"
      width={Math.round(height * 2.4)}
      height={height}
      className={`h-auto w-auto ${className}`}
      style={{ height, width: "auto" }}
      priority
    />
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {logo}
    </Link>
  );
}
