"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LiveSupportWidget } from "@/presentation/components/layout/live-support-widget";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";
import { scrollToHash } from "@/shared/utils/scroll-to-hash";

interface SiteChromeProps {
  children: ReactNode;
}

function scrollToCurrentHash() {
  scrollToHash(window.location.hash);
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const isStandalonePanelRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/instructor");

  useEffect(() => {
    if (isStandalonePanelRoute) {
      return;
    }

    scrollToCurrentHash();
    const timeoutIds = [100, 300].map((delay) => window.setTimeout(scrollToCurrentHash, delay));
    const onHashChange = () => scrollToCurrentHash();
    window.addEventListener("hashchange", onHashChange);

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [pathname, isStandalonePanelRoute]);

  if (isStandalonePanelRoute) {
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
