import { NextResponse } from "next/server";

import type { CreateEventInput } from "@/core/domain/admin-event";
import { createAdminEvent, listAdminEvents } from "@/core/use-cases/manage-admin-events";
import {
  formatInstructorNotificationSummary,
  notifyEventInstructorsAssigned,
} from "@/infrastructure/email/notify-event-instructors-assigned";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminEventRepository } from "@/infrastructure/repositories/supabase-admin-event-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const repository = new SupabaseAdminEventRepository(access.client);
    const events = await listAdminEvents(repository);
    return NextResponse.json({ data: events });
  } catch (error) {
    return apiCatchResponse(error, "Etkinlikler alınamadı.", {
      logLabel: "[admin/events GET]",
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as CreateEventInput;
    const repository = new SupabaseAdminEventRepository(access.client);
    const event = await createAdminEvent(repository, body);

    const instructorIds = body.instructorIds ?? [];
    let instructorNotifications = null;
    let notificationError: string | null = null;

    if (instructorIds.length > 0) {
      try {
        instructorNotifications = await notifyEventInstructorsAssigned(event, instructorIds);
        if (instructorNotifications.failed.length > 0) {
          console.error(
            "[admin/events POST] Eğitmen bildirim hataları:",
            instructorNotifications.failed,
          );
        }
      } catch (notifyError) {
        notificationError =
          notifyError instanceof Error ? notifyError.message : "Eğitmen bildirimi gönderilemedi.";
        console.error("[admin/events POST] Eğitmen bildirimi hatası:", notificationError);
      }
    }

    return NextResponse.json({
      data: event,
      instructorNotifications,
      notificationSummary: instructorNotifications
        ? formatInstructorNotificationSummary(instructorNotifications)
        : "",
      notificationError,
    }, { status: 201 });
  } catch (error) {
    return apiCatchResponse(error, "Etkinlik oluşturulamadı.", {
      logLabel: "[admin/events POST]",
      status: 400,
    });
  }
}
