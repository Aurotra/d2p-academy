import "server-only";

import {
  EMAIL_FROM_ADDRESS,
  EMAIL_REPLY_TO,
} from "@/shared/constants/email-brand";

/** Resend'de doğrulanmış domain adresi. Vercel + Supabase secrets'ta RESEND_FROM_EMAIL ile override edilebilir. */
export function getResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return configured;
  }
  return EMAIL_FROM_ADDRESS;
}

export interface ResendSendResult {
  id: string;
}

export async function postResendEmail(input: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}): Promise<ResendSendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      reply_to: EMAIL_REPLY_TO,
    }),
  });

  const rawBody = await response.text();
  let payload: { id?: string; message?: string; name?: string } | null = null;

  try {
    payload = rawBody ? (JSON.parse(rawBody) as { id?: string; message?: string; name?: string }) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.message ?? (rawBody || `HTTP ${response.status}`);
    throw new Error(`Resend hatası (${response.status}): ${detail}`);
  }

  if (!payload?.id) {
    throw new Error(`Resend beklenmeyen yanıt: ${rawBody || "boş yanıt"}`);
  }

  return { id: payload.id };
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
