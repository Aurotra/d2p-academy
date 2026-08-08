import { NextResponse } from "next/server";

import { getInstructorNotificationTarget } from "@/infrastructure/auth/get-instructor-notification-target";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { sendInstructorGrantedNotification } from "@/infrastructure/email/send-instructor-notification-email";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const target = await getInstructorNotificationTarget(id);
    const emailResult = await sendInstructorGrantedNotification({
      recipientName: target.fullName,
      email: target.email,
      memberRole: target.role,
    });

    if (!emailResult.emailSent) {
      console.error("[notify-instructor-granted] E-posta hatası:", emailResult.emailError);
      return NextResponse.json(
        {
          error: emailResult.emailError ?? "Bildirim e-postası gönderilemedi.",
          emailSent: false,
          attemptedChannels: emailResult.attemptedChannels,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: {
        fullName: target.fullName,
        email: target.email,
        emailSent: true,
        delivery: emailResult.delivery,
        resendId: emailResult.resendId,
        attemptedChannels: emailResult.attemptedChannels,
      },
    });
  } catch (error) {
    return apiCatchResponse(error, "Bildirim e-postası gönderilemedi.", {
      logLabel: "[admin/notify-instructor-granted]",
      status: 400,
    });
  }
}
