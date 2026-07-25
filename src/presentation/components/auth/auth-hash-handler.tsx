"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SESSION_CHANGED_EVENT } from "@/shared/utils/session-events";

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    void client.auth.getSession().then(({ error }) => {
      if (error) {
        console.error("[auth-hash-handler]", error.message);
        return;
      }

      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
      router.refresh();
    });
  }, [router]);

  return null;
}
