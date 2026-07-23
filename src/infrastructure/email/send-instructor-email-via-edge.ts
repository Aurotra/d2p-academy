import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function sendInstructorEmailViaEdge(input: {
  kind: "granted" | "revoked";
  recipientName: string;
  email: string;
  memberRole?: "parent" | "student" | "admin" | "instructor";
}): Promise<void> {
  const client = createServiceRoleClient();
  const { data, error } = await client.functions.invoke("send-instructor-email", {
    body: input,
  });

  if (error) {
    throw new Error(`E-posta servisi hatası: ${error.message}`);
  }

  const payload = data as { error?: string; ok?: boolean } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }
}
