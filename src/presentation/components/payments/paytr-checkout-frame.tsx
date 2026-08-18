"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

import { buttonLinkClasses } from "@/presentation/components/ui/button";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void;
  }
}

interface PaytrCheckoutFrameProps {
  iframeUrl: string;
  nonce?: string;
  enrollHref: string;
}

export function PaytrCheckoutFrame({ iframeUrl, nonce, enrollHref }: PaytrCheckoutFrameProps) {
  const startedRef = useRef(false);

  const startResize = useCallback(() => {
    if (startedRef.current || typeof window.iFrameResize !== "function") {
      return;
    }
    startedRef.current = true;
    window.iFrameResize({}, "#paytriframe");
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("fresh")) {
      return;
    }
    url.searchParams.delete("fresh");
    const search = url.searchParams.toString();
    window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}`);
  }, []);

  return (
    <>
      <iframe
        id="paytriframe"
        title="PayTR güvenli ödeme"
        src={iframeUrl}
        frameBorder={0}
        scrolling="no"
        className="mt-6 min-h-[720px] w-full rounded-2xl border border-border-surface"
        style={{ width: "100%" }}
      />
      <p className="mt-4 text-sm text-muted">
        Form geçersiz görünürse sayfayı yenilemeyin; yeni ödeme başlatın.
      </p>
      <Link href={enrollHref} className={`${buttonLinkClasses("outline")} mt-3 min-h-[44px] w-full`}>
        Yeni ödeme başlat
      </Link>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js?v2"
        strategy="afterInteractive"
        nonce={nonce}
        onLoad={startResize}
      />
    </>
  );
}
