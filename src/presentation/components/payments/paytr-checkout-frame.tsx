"use client";

import Script from "next/script";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void;
  }
}

interface PaytrCheckoutFrameProps {
  iframeUrl: string;
  nonce?: string;
}

export function PaytrCheckoutFrame({ iframeUrl, nonce }: PaytrCheckoutFrameProps) {
  const startedRef = useRef(false);

  const startResize = useCallback(() => {
    if (startedRef.current || typeof window.iFrameResize !== "function") {
      return;
    }
    startedRef.current = true;
    window.iFrameResize({}, "#paytriframe");
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
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js?v2"
        strategy="afterInteractive"
        nonce={nonce}
        onLoad={startResize}
      />
    </>
  );
}
