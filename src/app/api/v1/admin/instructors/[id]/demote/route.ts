import { NextResponse } from "next/server";

import { sendInstructorRoleRevokedEmail } from "@/infrastructure/email/instructor-role-revoked-email";
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
      try {
        emailSent = await sendInstructorRoleRevokedEmail({
          recipientName: member.fullName,
          email: member.email,
          memberRole: member.role,
        });
      } catch (error) {
        emailError = error instanceof Error ? error.message : "E-posta gönderilemedi.";
        console.error("[demote-instructor] E-posta hatası:", emailError);
      }
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
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
