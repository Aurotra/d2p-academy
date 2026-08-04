import "server-only";

import {
  getResendFromAddress,
  isResendConfigured,
  postResendEmail,
  type ResendSendResult,
} from "@/infrastructure/email/resend-config";

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY tanımlı değil.");
  }

  return postResendEmail({
    apiKey,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export { getResendFromAddress, isResendConfigured };
