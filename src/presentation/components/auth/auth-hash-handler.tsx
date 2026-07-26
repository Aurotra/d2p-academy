"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { mapAuthQueryErrorToTurkish, AUTH_HASH_ERROR_EVENT } from "@/shared/utils/auth-errors";
import { SESSION_CHANGED_EVENT } from "@/shared/utils/session-events";

function sanitizeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function cleanUrlHash(): string {
  const url = new URL(window.location.href);
  url.hash = "";
  const next = `${url.pathname}${url.search}`;
  window.history.replaceState(null, "", next);
  return next;
}

function parseHashParams(): URLSearchParams | null {
  const raw = window.location.hash.slice(1);
  if (!raw) {
    return null;
  }

  return new URLSearchParams(raw);
}

export function AuthHashHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hashParams = parseHashParams();
    if (!hashParams) {
      return;
    }

    const hashError = hashParams.get("error");
    const hashErrorCode = hashParams.get("error_code");
    const hashErrorDescription = hashParams.get("error_description");

    if (hashError || hashErrorCode || hashErrorDescription) {
      const message =
        mapAuthQueryErrorToTurkish(hashErrorCode) ??
        mapAuthQueryErrorToTurkish(hashError) ??
        mapAuthQueryErrorToTurkish("auth") ??
        "E-posta onayı tamamlanamadı.";

      sessionStorage.setItem("d2p_auth_hash_error", message);
      cleanUrlHash();
      window.dispatchEvent(new Event(AUTH_HASH_ERROR_EVENT));

      if (pathname === "/login" || pathname === "/register") {
        router.refresh();
      }

      return;
    }

    if (!window.location.hash.includes("access_token")) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[auth-hash-handler]", error.message);
        return;
      }

      if (!data.session) {
        return;
      }

      const url = new URL(window.location.href);
      const nextPath = sanitizeRedirectPath(url.searchParams.get("next"));
      cleanUrlHash();
      window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));

      if (pathname === "/login" || pathname === "/register" || pathname === "/") {
        router.replace(nextPath);
      } else {
        router.refresh();
      }
    });
  }, [pathname, router]);

  return null;
}
