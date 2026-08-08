import type { ReactNode } from "react";

import { BRAND_SURFACE_PAGE, BRAND_SURFACE_PAGE_GLOW } from "@/shared/constants/brand-surfaces";

interface PublicPageShellProps {
  children: ReactNode;
  className?: string;
}

export function PublicPageShell({ children, className = "" }: PublicPageShellProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${BRAND_SURFACE_PAGE} ${className}`}>
      <div
        aria-hidden
        className={`${BRAND_SURFACE_PAGE_GLOW} -left-24 top-0 h-80 w-80 bg-surface-tint-yellow`}
      />
      <div
        aria-hidden
        className={`${BRAND_SURFACE_PAGE_GLOW} -right-20 top-24 h-72 w-72 bg-surface-tint-green`}
      />
      <div
        aria-hidden
        className={`${BRAND_SURFACE_PAGE_GLOW} bottom-0 left-1/3 h-64 w-64 bg-primary/10`}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
