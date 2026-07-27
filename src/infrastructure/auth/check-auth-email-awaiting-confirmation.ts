import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function isAuthEmailAwaitingConfirmation(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  try {
    const client = createServiceRoleClient();
    const { data, error } = await client.rpc("is_auth_email_awaiting_confirmation", {
      p_email: normalized,
    });

    if (error) {
      console.error("[isAuthEmailAwaitingConfirmation]", error.message);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("[isAuthEmailAwaitingConfirmation]", error);
    return false;
  }
}
