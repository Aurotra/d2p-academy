import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { notifySessionChanged } from "@/shared/utils/session-events";

type SiteSessionKind = "email" | "student";

export async function performSiteSignOut(
  sessionKind: SiteSessionKind | null,
): Promise<void> {
  const endpoint =
    sessionKind === "student" ? "/api/v1/auth/student-logout" : "/api/v1/auth/logout";

  const response = await fetch(endpoint, { method: "POST" });
  if (!response.ok) {
    throw new Error("Çıkış yapılamadı.");
  }

  if (sessionKind !== "student") {
    const client = createSupabaseBrowserClient();
    await client?.auth.signOut();
  }

  notifySessionChanged();
}
