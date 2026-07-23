import "server-only";

import { sendInstructorRoleGrantedEmail } from "@/infrastructure/email/instructor-role-granted-email";
import { sendInstructorRoleRevokedEmail } from "@/infrastructure/email/instructor-role-revoked-email";
import { sendInstructorEmailViaEdge } from "@/infrastructure/email/send-instructor-email-via-edge";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";

export async function sendInstructorGrantedNotification(input: {
  recipientName: string;
  email: string;
}): Promise<{ emailSent: boolean; emailError: string | null; delivery: "vercel" | "supabase" }> {
  if (isResendConfigured()) {
    try {
      await sendInstructorRoleGrantedEmail(input);
      return { emailSent: true, emailError: null, delivery: "vercel" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
      return { emailSent: false, emailError: message, delivery: "vercel" };
    }
  }

  try {
    await sendInstructorEmailViaEdge({ kind: "granted", ...input });
    return { emailSent: true, emailError: null, delivery: "supabase" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return {
      emailSent: false,
      emailError: `${message} (Vercel RESEND_API_KEY yok; Supabase send-instructor-email de başarısız.)`,
      delivery: "supabase",
    };
  }
}

export async function sendInstructorRevokedNotification(input: {
  recipientName: string;
  email: string;
  memberRole: "parent" | "student" | "admin" | "instructor";
}): Promise<{ emailSent: boolean; emailError: string | null; delivery: "vercel" | "supabase" }> {
  if (isResendConfigured()) {
    try {
      await sendInstructorRoleRevokedEmail(input);
      return { emailSent: true, emailError: null, delivery: "vercel" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
      return { emailSent: false, emailError: message, delivery: "vercel" };
    }
  }

  try {
    await sendInstructorEmailViaEdge({ kind: "revoked", ...input });
    return { emailSent: true, emailError: null, delivery: "supabase" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return {
      emailSent: false,
      emailError: `${message} (Vercel RESEND_API_KEY yok; Supabase send-instructor-email de başarısız.)`,
      delivery: "supabase",
    };
  }
}
