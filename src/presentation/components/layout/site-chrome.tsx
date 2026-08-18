"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthHashHandler } from "@/presentation/components/auth/auth-hash-handler";
import { WhatsAppSupportWidget } from "@/presentation/components/layout/whatsapp-support-widget";
import { SiteFooter } from "@/presentation/components/layout/site-footer";
import { SiteHeader } from "@/presentation/components/layout/site-header";
import { SiteAuthProvider } from "@/presentation/providers/site-auth-provider";
import { isInstructorAppPath } from "@/shared/utils/auth-redirect";
import { scrollToHash } from "@/shared/utils/scroll-to-hash";

interface SiteChromeProps {
  children: ReactNode;
}

function scrollToCurrentHash() {
  scrollToHash(window.location.hash);
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname() ?? "";
  const isStandalonePanelRoute =
    pathname.startsWith("/admin") || isInstructorAppPath(pathname);

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

  return (
    <>
      <AuthHashHandler />
      <SiteAuthProvider>
        <SiteHeader />
        {isStandalonePanelRoute ? (
          children
        ) : (
          <>
            <main className="pb-24 sm:pb-0">{children}</main>
            <SiteFooter />
            <WhatsAppSupportWidget />
          </>
        )}
      </SiteAuthProvider>
    </>
  );
}
