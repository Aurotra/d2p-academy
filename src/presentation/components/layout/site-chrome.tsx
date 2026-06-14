"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LiveSupportWidget } from "@/presentation/components/layout/live-support-widget";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";

interface SiteChromeProps {
  children: ReactNode;
}

function scrollToCurrentHash() {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }

  const element = document.querySelector(hash);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    scrollToCurrentHash();
    const timeoutId = window.setTimeout(scrollToCurrentHash, 100);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, isAdminRoute]);

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
