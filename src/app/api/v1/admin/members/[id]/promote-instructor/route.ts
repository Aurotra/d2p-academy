import { NextResponse } from "next/server";

import { sendInstructorGrantedNotification } from "@/infrastructure/email/send-instructor-notification-email";
import { getInstructorNotificationTarget } from "@/infrastructure/auth/get-instructor-notification-target";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { promoteMemberToInstructor } from "@/infrastructure/auth/set-user-role";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const adminAccess = await getAdminAccess(access.client);
  if (!adminAccess.authorized) {
    return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const member = await promoteMemberToInstructor(id);
    const target = await getInstructorNotificationTarget(id);
    const emailResult = await sendInstructorGrantedNotification({
      recipientName: target.fullName,
      email: target.email,
      memberRole: target.role,
    });

    if (!emailResult.emailSent) {
      console.error("[promote-instructor] E-posta hatası:", emailResult.emailError);
    }

    const audit = new SupabaseAdminAuditLogRepository(access.client);
    await audit.logInstructorGranted({
      actorId: adminAccess.profile.id,
      actorEmail: adminAccess.profile.email,
      memberId: id,
      memberName: member.fullName,
      memberEmail: member.email,
      memberRole: member.role,
      emailSent: emailResult.emailSent,
    });

    return NextResponse.json({
      data: {
        ...member,
        emailSent: emailResult.emailSent,
        emailError: emailResult.emailError,
      },
    });
  } catch (error) {
    return apiCatchResponse(error, "Eğitmen yetkisi verilemedi.", {
      logLabel: "[admin/promote-instructor]",
      status: 400,
    });
  }
}
