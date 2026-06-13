"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LiveSupportWidget } from "@/presentation/components/layout/live-support-widget";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";

interface SiteChromeProps {
  children: ReactNode;
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <LiveSupportWidget />
    </>
  );
}
