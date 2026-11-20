import "server-only";

import { invokeSupabaseEdgeFunction } from "@/infrastructure/email/send-instructor-email-via-edge";
import {
  getResendFromAddress,
  isResendConfigured,
  postResendEmail,
  type ResendSendResult,
} from "@/infrastructure/email/resend-config";

/**
 * Send via Vercel RESEND_API_KEY when present; otherwise fall back to the
 * Supabase Edge Function which already has RESEND_API_KEY in project secrets.
 */
export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (apiKey) {
    return postResendEmail({
      apiKey,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }

  console.warn(
    "[sendResendEmail] RESEND_API_KEY missing on app host; falling back to send-transactional-email edge",
  );

  await invokeSupabaseEdgeFunction<{ ok?: boolean }>("send-transactional-email", {
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return { id: `edge-${Date.now()}` };
}

export { getResendFromAddress, isResendConfigured };
