import "server-only";

import {
  sendEventInstructorAssignedEmail,
  type EventInstructorAssignedEmailInput,
} from "@/infrastructure/email/event-instructor-assigned-email";
import { invokeSupabaseEdgeFunction } from "@/infrastructure/email/send-instructor-email-via-edge";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";

export interface EventInstructorAssignmentDeliveryResult {
  emailSent: boolean;
  emailError: string | null;
  delivery: "vercel" | "supabase" | null;
  resendId: string | null;
}

export async function sendEventInstructorAssignmentNotification(input: {
  recipientName: string;
  email: string;
  event: EventInstructorAssignedEmailInput;
}): Promise<EventInstructorAssignmentDeliveryResult> {
  if (isResendConfigured()) {
    try {
      const result = await sendEventInstructorAssignedEmail(input);
      return {
        emailSent: true,
        emailError: null,
        delivery: "vercel",
        resendId: result.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
      // fall through to edge
      try {
        await invokeSupabaseEdgeFunction<{ ok: boolean }>("send-event-instructor-assignment", {
          recipientName: input.recipientName,
          email: input.email,
          eventTitle: input.event.eventTitle,
          eventType: input.event.eventType,
          categoryName: input.event.categoryName,
          startAt: input.event.startAt.toISOString(),
          endAt: input.event.endAt.toISOString(),
          locationName: input.event.locationName,
          isOnline: input.event.isOnline,
          meetingUrl: input.event.meetingUrl,
          eventId: input.event.eventId,
        });
        return {
          emailSent: true,
          emailError: null,
          delivery: "supabase",
          resendId: null,
        };
      } catch (edgeError) {
        const edgeMessage = edgeError instanceof Error ? edgeError.message : "E-posta gönderilemedi.";
        return {
          emailSent: false,
          emailError: `${message} | ${edgeMessage}`,
          delivery: null,
          resendId: null,
        };
      }
    }
  }

  try {
    await invokeSupabaseEdgeFunction<{ ok: boolean }>("send-event-instructor-assignment", {
      recipientName: input.recipientName,
      email: input.email,
      eventTitle: input.event.eventTitle,
      eventType: input.event.eventType,
      categoryName: input.event.categoryName,
      startAt: input.event.startAt.toISOString(),
      endAt: input.event.endAt.toISOString(),
      locationName: input.event.locationName,
      isOnline: input.event.isOnline,
      meetingUrl: input.event.meetingUrl,
      eventId: input.event.eventId,
    });
    return {
      emailSent: true,
      emailError: null,
      delivery: "supabase",
      resendId: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return {
      emailSent: false,
      emailError: message,
      delivery: null,
      resendId: null,
    };
  }
}
