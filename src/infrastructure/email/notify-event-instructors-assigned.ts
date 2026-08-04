import "server-only";

import type { AdminEventRecord } from "@/core/domain/admin-event";
import { sendEventInstructorAssignmentNotification } from "@/infrastructure/email/send-event-instructor-assignment-notification";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export interface InstructorAssignmentNotificationResult {
  instructorId: string;
  fullName: string;
  email: string;
  emailSent: boolean;
  emailError: string | null;
}

export interface NotifyEventInstructorsResult {
  attempted: number;
  sent: number;
  failed: InstructorAssignmentNotificationResult[];
  successes: InstructorAssignmentNotificationResult[];
}

async function resolveInstructorEmail(
  userId: string,
): Promise<{ fullName: string; email: string } | null> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  let email = profile.email?.trim() ?? "";
  if (!email) {
    const { data: authUser } = await serviceClient.auth.admin.getUserById(userId);
    email = authUser.user?.email?.trim() ?? "";
  }

  if (!email) {
    return null;
  }

  return {
    fullName: profile.full_name,
    email,
  };
}

export async function notifyEventInstructorsAssigned(
  event: AdminEventRecord,
  instructorIds: string[],
): Promise<NotifyEventInstructorsResult> {
  const uniqueIds = [...new Set(instructorIds.filter(Boolean))];
  const results: InstructorAssignmentNotificationResult[] = [];

  await Promise.all(
    uniqueIds.map(async (instructorId) => {
      const target = await resolveInstructorEmail(instructorId);
      if (!target) {
        results.push({
          instructorId,
          fullName: "Bilinmeyen eğitmen",
          email: "—",
          emailSent: false,
          emailError: "E-posta adresi bulunamadı.",
        });
        return;
      }

      const delivery = await sendEventInstructorAssignmentNotification({
        recipientName: target.fullName,
        email: target.email,
        event: {
          recipientName: target.fullName,
          eventTitle: event.title,
          eventType: event.eventType,
          categoryName: event.categoryName,
          startAt: event.startAt,
          endAt: event.endAt,
          locationName: event.locationName,
          isOnline: event.isOnline,
          meetingUrl: event.meetingUrl,
          eventId: event.id,
        },
      });

      results.push({
        instructorId,
        fullName: target.fullName,
        email: target.email,
        emailSent: delivery.emailSent,
        emailError: delivery.emailError,
      });
    }),
  );

  const successes = results.filter((result) => result.emailSent);
  const failed = results.filter((result) => !result.emailSent);

  return {
    attempted: results.length,
    sent: successes.length,
    failed,
    successes,
  };
}

export function formatInstructorNotificationSummary(result: NotifyEventInstructorsResult): string {
  if (result.attempted === 0) {
    return "";
  }

  if (result.sent === result.attempted) {
    return `${result.sent} eğitmene atama bildirimi gönderildi.`;
  }

  if (result.sent === 0) {
    return `Eğitmen bildirimi gönderilemedi (${result.failed.length} hata).`;
  }

  return `${result.sent}/${result.attempted} eğitmene bildirim gönderildi; ${result.failed.length} başarısız.`;
}
