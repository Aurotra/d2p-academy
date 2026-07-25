import "server-only";

import { sendSignupConfirmationEmail } from "@/infrastructure/email/signup-confirmation-email";
import { sendSignupConfirmationViaEdge } from "@/infrastructure/email/send-signup-confirmation-via-edge";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";

export async function sendSignupConfirmationNotification(input: {
  recipientName: string;
  email: string;
  actionLink: string;
}): Promise<{ emailSent: boolean; emailError: string | null; delivery: "vercel" | "supabase" | "none" }> {
  if (isResendConfigured()) {
    try {
      await sendSignupConfirmationEmail(input);
      return { emailSent: true, emailError: null, delivery: "vercel" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
      try {
        await sendSignupConfirmationViaEdge(input);
        return { emailSent: true, emailError: null, delivery: "supabase" };
      } catch (edgeError) {
        const edgeMessage = edgeError instanceof Error ? edgeError.message : "E-posta gönderilemedi.";
        return {
          emailSent: false,
          emailError: `${message} (Supabase yedek servisi de başarısız: ${edgeMessage})`,
          delivery: "none",
        };
      }
    }
  }

  try {
    await sendSignupConfirmationViaEdge(input);
    return { emailSent: true, emailError: null, delivery: "supabase" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return {
      emailSent: false,
      emailError: `${message} (Vercel RESEND_API_KEY yok; Supabase send-signup-confirmation-email de başarısız.)`,
      delivery: "none",
    };
  }
}
