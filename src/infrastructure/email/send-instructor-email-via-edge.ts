import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function invokeSupabaseEdgeFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service role veya URL tanımlı değil.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawBody = await response.text();
  let payload: TResponse & { error?: string; ok?: boolean } | null = null;

  try {
    payload = rawBody ? (JSON.parse(rawBody) as TResponse & { error?: string; ok?: boolean }) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.error ?? (rawBody || `HTTP ${response.status}`);
    throw new Error(`${functionName} hatası (${response.status}): ${detail}`);
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  if (functionName === "send-instructor-email" && payload?.ok !== true) {
    throw new Error(
      `${functionName} beklenmeyen yanıt döndü: ${rawBody || "boş yanıt"}. Function deploy edilmiş mi?`,
    );
  }

  return payload as TResponse;
}

export async function sendInstructorEmailViaEdge(input: {
  kind: "granted" | "revoked";
  recipientName: string;
  email: string;
  memberRole?: "parent" | "student" | "admin" | "instructor";
}): Promise<void> {
  try {
    await invokeSupabaseEdgeFunction<{ ok: boolean }>("send-instructor-email", input);
    return;
  } catch (directError) {
    const client = createServiceRoleClient();
    const { data, error } = await client.functions.invoke("send-instructor-email", {
      body: input,
    });

    if (error) {
      const directMessage =
        directError instanceof Error ? directError.message : "Bilinmeyen edge hatası";
      throw new Error(`${directMessage} | invoke: ${error.message}`);
    }

    const payload = data as { error?: string; ok?: boolean } | null;
    if (payload?.error) {
      throw new Error(payload.error);
    }

    if (payload?.ok !== true) {
      const directMessage =
        directError instanceof Error ? directError.message : "Bilinmeyen edge hatası";
      throw new Error(
        `${directMessage} | invoke: send-instructor-email beklenmeyen yanıt (function deploy edilmiş mi?)`,
      );
    }
  }
}
