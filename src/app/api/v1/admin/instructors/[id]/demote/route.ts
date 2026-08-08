import { NextResponse } from "next/server";

import { sendInstructorRevokedNotification } from "@/infrastructure/email/send-instructor-notification-email";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { demoteInstructorToMember } from "@/infrastructure/auth/set-user-role";
import { apiCatchResponse } from "@/shared/utils/api-error";

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
        console.error("[demote-instructor] E-posta hatası:", emailError);
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
    return apiCatchResponse(error, "Eğitmen yetkisi geri alınamadı.", {
      logLabel: "[admin/instructors demote]",
      status: 400,
    });
  }
}
