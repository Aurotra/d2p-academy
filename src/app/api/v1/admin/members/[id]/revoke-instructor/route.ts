import { NextResponse } from "next/server";

import { sendInstructorRevokedNotification } from "@/infrastructure/email/send-instructor-notification-email";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { demoteInstructorToMember } from "@/infrastructure/auth/set-user-role";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const member = await demoteInstructorToMember(id);

    let emailSent = false;
    let emailError: string | null = null;

    if (member.email) {
      const emailResult = await sendInstructorRevokedNotification({
        recipientName: member.fullName,
        email: member.email,
        memberRole: member.role,
      });
      emailSent = emailResult.emailSent;
      emailError = emailResult.emailError;

      if (!emailSent) {
        console.error("[revoke-instructor] E-posta hatası:", emailError);
      }
    } else {
      emailError = "Profilde e-posta adresi yok.";
    }

    return NextResponse.json({
      data: {
        ...member,
        emailSent,
        emailError,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eğitmen yetkisi geri alınamadı.";
    const status = message.includes("SUPABASE_SERVICE_ROLE_KEY") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
