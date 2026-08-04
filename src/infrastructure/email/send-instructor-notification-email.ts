import "server-only";

import { sendInstructorRoleGrantedEmail } from "@/infrastructure/email/instructor-role-granted-email";
import { sendInstructorRoleRevokedEmail } from "@/infrastructure/email/instructor-role-revoked-email";
import { sendInstructorEmailViaEdge } from "@/infrastructure/email/send-instructor-email-via-edge";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";

export interface InstructorEmailDeliveryResult {
  emailSent: boolean;
  emailError: string | null;
  delivery: "vercel" | "supabase" | null;
  resendId: string | null;
  attemptedChannels: string[];
}

async function tryVercelResend(
  send: () => Promise<{ id: string }>,
): Promise<{ id: string } | null> {
  if (!isResendConfigured()) {
    return null;
  }

  return send();
}

export async function sendInstructorGrantedNotification(input: {
  recipientName: string;
  email: string;
  memberRole?: "parent" | "student" | "admin" | "instructor";
}): Promise<InstructorEmailDeliveryResult> {
  const attemptedChannels: string[] = [];
  const errors: string[] = [];

  try {
    attemptedChannels.push("vercel-resend");
    const result = await tryVercelResend(() => sendInstructorRoleGrantedEmail(input));
    if (result) {
      return {
        emailSent: true,
        emailError: null,
        delivery: "vercel",
        resendId: result.id,
        attemptedChannels,
      };
    }
  } catch (error) {
    errors.push(
      `Vercel/Resend: ${error instanceof Error ? error.message : "E-posta gönderilemedi."}`,
    );
  }

  try {
    attemptedChannels.push("supabase-edge");
    await sendInstructorEmailViaEdge({ kind: "granted", ...input });
    return {
      emailSent: true,
      emailError: null,
      delivery: "supabase",
      resendId: null,
      attemptedChannels,
    };
  } catch (error) {
    errors.push(
      `Supabase Edge: ${error instanceof Error ? error.message : "E-posta gönderilemedi."}`,
    );
  }

  return {
    emailSent: false,
    emailError: errors.join(" | "),
    delivery: null,
    resendId: null,
    attemptedChannels,
  };
}

export async function sendInstructorRevokedNotification(input: {
  recipientName: string;
  email: string;
  memberRole: "parent" | "student" | "admin" | "instructor";
}): Promise<InstructorEmailDeliveryResult> {
  const attemptedChannels: string[] = [];
  const errors: string[] = [];

  try {
    attemptedChannels.push("vercel-resend");
    const result = await tryVercelResend(() => sendInstructorRoleRevokedEmail(input));
    if (result) {
      return {
        emailSent: true,
        emailError: null,
        delivery: "vercel",
        resendId: result.id,
        attemptedChannels,
      };
    }
  } catch (error) {
    errors.push(
      `Vercel/Resend: ${error instanceof Error ? error.message : "E-posta gönderilemedi."}`,
    );
  }

  try {
    attemptedChannels.push("supabase-edge");
    await sendInstructorEmailViaEdge({ kind: "revoked", ...input });
    return {
      emailSent: true,
      emailError: null,
      delivery: "supabase",
      resendId: null,
      attemptedChannels,
    };
  } catch (error) {
    errors.push(
      `Supabase Edge: ${error instanceof Error ? error.message : "E-posta gönderilemedi."}`,
    );
  }

  return {
    emailSent: false,
    emailError: errors.join(" | "),
    delivery: null,
    resendId: null,
    attemptedChannels,
  };
}
