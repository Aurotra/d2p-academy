import { NextResponse } from "next/server";

import {
  formatInstructorNotificationSummary,
  notifyEventInstructorsAssigned,
} from "@/infrastructure/email/notify-event-instructors-assigned";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminEventRepository } from "@/infrastructure/repositories/supabase-admin-event-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const repository = new SupabaseAdminEventRepository(access.client);
    const events = await repository.listAll();
    const event = events.find((item) => item.id === id);

    if (!event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    if (event.instructorIds.length === 0) {
      return NextResponse.json({ error: "Bu etkinliğe atanmış eğitmen yok." }, { status: 400 });
    }

    const instructorNotifications = await notifyEventInstructorsAssigned(
      event,
      event.instructorIds,
    );

    if (instructorNotifications.failed.length > 0) {
      console.error("[notify-instructors] Hatalar:", instructorNotifications.failed);
    }

    const summary = formatInstructorNotificationSummary(instructorNotifications);

    if (instructorNotifications.sent === 0) {
      return NextResponse.json(
        {
          error: summary,
          instructorNotifications,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: {
        eventId: event.id,
        eventTitle: event.title,
        instructorNotifications,
        notificationSummary: summary,
      },
    });
  } catch (error) {
    return apiCatchResponse(error, "Bildirim gönderilemedi.", {
      logLabel: "[admin/events notify-instructors]",
      status: 400,
    });
  }
}
