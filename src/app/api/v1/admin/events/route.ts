import { NextResponse } from "next/server";

import type { CreateEventInput } from "@/core/domain/admin-event";
import { createAdminEvent, listAdminEvents } from "@/core/use-cases/manage-admin-events";
import {
  formatInstructorNotificationSummary,
  notifyEventInstructorsAssigned,
} from "@/infrastructure/email/notify-event-instructors-assigned";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminEventRepository } from "@/infrastructure/repositories/supabase-admin-event-repository";

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const repository = new SupabaseAdminEventRepository(access.client);
    const events = await listAdminEvents(repository);
    return NextResponse.json({ data: events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Etkinlikler alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as CreateEventInput;
    const repository = new SupabaseAdminEventRepository(access.client);
    const event = await createAdminEvent(repository, body);

    let instructorNotifications = null;
    if (body.instructorIds.length > 0) {
      instructorNotifications = await notifyEventInstructorsAssigned(event, body.instructorIds);
      if (instructorNotifications.failed.length > 0) {
        console.error(
          "[admin/events POST] Eğitmen bildirim hataları:",
          instructorNotifications.failed,
        );
      }
    }

    return NextResponse.json({
      data: event,
      instructorNotifications,
      notificationSummary: instructorNotifications
        ? formatInstructorNotificationSummary(instructorNotifications)
        : "",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Etkinlik oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
