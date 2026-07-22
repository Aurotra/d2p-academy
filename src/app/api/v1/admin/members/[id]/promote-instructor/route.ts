import { NextResponse } from "next/server";

import { sendInstructorRoleGrantedEmail } from "@/infrastructure/email/instructor-role-granted-email";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { promoteMemberToInstructor } from "@/infrastructure/auth/set-user-role";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const member = await promoteMemberToInstructor(id);

    let emailSent = false;
    let emailError: string | null = null;

    try {
      emailSent = await sendInstructorRoleGrantedEmail({
        recipientName: member.fullName,
        email: member.email,
      });
    } catch (error) {
      emailError = error instanceof Error ? error.message : "E-posta gönderilemedi.";
      console.error("[promote-instructor] E-posta hatası:", emailError);
    }

    return NextResponse.json({
      data: {
        ...member,
        emailSent,
        emailError,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eğitmen yetkisi verilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
