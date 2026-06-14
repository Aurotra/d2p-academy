"use client";

import { useCallback, useEffect, useState } from "react";

import { getTawkEmbedSrc, isTawkConfigured } from "@/shared/constants/live-support";

function openTawkChat() {
  if (window.Tawk_API?.maximize) {
    window.Tawk_API.maximize();
    return true;
  }

  return false;
}

export function LiveSupportWidget() {
  const [isReady, setIsReady] = useState(false);
  const embedSrc = getTawkEmbedSrc();

  useEffect(() => {
    if (!embedSrc || document.getElementById("tawk-script")) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    window.Tawk_API.onLoad = () => {
      window.Tawk_API?.hideWidget?.();
      setIsReady(true);
    };

    const script = document.createElement("script");
    script.id = "tawk-script";
    script.async = true;
    script.src = embedSrc;
    script.charset = "UTF-8";
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => {
      if (!window.Tawk_API?.maximize) {
        setIsReady(true);
      }
    });
    document.body.appendChild(script);
  }, [embedSrc]);

  const handleClick = useCallback(() => {
    if (openTawkChat()) {
      return;
    }

    window.alert("Canlı destek yükleniyor, lütfen birkaç saniye sonra tekrar deneyin.");
  }, []);

  if (!isTawkConfigured()) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Canlı destek"
      disabled={!isReady}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/30 transition hover:bg-primary-hover hover:shadow-glow-primary disabled:cursor-wait disabled:opacity-80"
      onClick={handleClick}
    >
      <span
        className={`inline-flex h-2 w-2 rounded-full ${isReady ? "bg-emerald-400" : "animate-pulse bg-amber-300"}`}
      />
      {isReady ? "Canlı Destek" : "Bağlanıyor..."}
    </button>
  );
}
