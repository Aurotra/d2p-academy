import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parseAdminNotificationEmails,
  shouldNotifyAdminOfEnrollment,
} from "@/infrastructure/email/admin-enrollment-notify";
import { sendParentEnrollmentAdminEmail } from "@/infrastructure/email/parent-enrollment-admin-email";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";

async function resolveAdminNotificationEmails(client: SupabaseClient): Promise<string[]> {
  const fromEnv = parseAdminNotificationEmails(process.env.ADMIN_EMAIL);
  if (fromEnv.length > 0) {
    return fromEnv;
  }

  const { data } = await client
    .from("profiles")
    .select("email")
    .eq("role", "admin")
    .eq("is_active", true);

  return parseAdminNotificationEmails(
    (data ?? [])
      .map((row) => (typeof row.email === "string" ? row.email : ""))
      .join(","),
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Fire-and-forget admin mail after a parent (or parent's child) is confirmed on a course.
 * Never throws to the caller — enrollment/payment must not fail if mail fails.
 */
export async function notifyAdminOfParentEnrollment(
  client: SupabaseClient,
  input: {
    enrollmentId: string;
    paymentLabel: string;
    alreadyEnrolled?: boolean;
    alreadyPaid?: boolean;
  },
): Promise<void> {
  try {
    if (!shouldNotifyAdminOfEnrollment(input)) {
      return;
    }

    if (!isResendConfigured()) {
      console.warn("[admin enrollment notify] RESEND_API_KEY missing; skipped");
      return;
    }

    const { data: enrollment, error: enrollmentError } = await client
      .from("enrollments")
      .select(
        `
        id,
        status,
        enrollment_source,
        user_id,
        event_id,
        events ( id, title ),
        profiles ( id, full_name, email, parent_id, parent_phone, username )
      `,
      )
      .eq("id", input.enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      console.error(
        "[admin enrollment notify] enrollment lookup failed",
        enrollmentError?.message ?? "missing row",
      );
      return;
    }

    if (
      !shouldNotifyAdminOfEnrollment({
        enrollmentSource: enrollment.enrollment_source as string | null,
        status: String(enrollment.status),
      })
    ) {
      return;
    }

    const student = unwrapOne(
      enrollment.profiles as
        | {
            id: string;
            full_name: string | null;
            email: string | null;
            parent_id: string | null;
            parent_phone: string | null;
            username: string | null;
          }
        | {
            id: string;
            full_name: string | null;
            email: string | null;
            parent_id: string | null;
            parent_phone: string | null;
            username: string | null;
          }[]
        | null,
    );
    const event = unwrapOne(
      enrollment.events as
        | { id: string; title: string | null }
        | { id: string; title: string | null }[]
        | null,
    );

    let parentName = "—";
    let parentEmail = "—";
    let parentPhone = student?.parent_phone?.trim() || "—";

    if (student?.parent_id) {
      const { data: parent } = await client
        .from("profiles")
        .select("full_name, email, parent_phone")
        .eq("id", student.parent_id)
        .maybeSingle();
      parentName = parent?.full_name?.trim() || parentName;
      parentEmail = parent?.email?.trim() || parentEmail;
      parentPhone = parent?.parent_phone?.trim() || parentPhone;
    }

    const recipients = await resolveAdminNotificationEmails(client);
    if (recipients.length === 0) {
      console.warn(
        "[admin enrollment notify] ADMIN_EMAIL unset and no admin profile emails; skipped",
      );
      return;
    }

    const payload = {
      studentName: student?.full_name?.trim() || student?.username?.trim() || "Öğrenci",
      parentName,
      parentEmail,
      parentPhone,
      eventTitle: event?.title?.trim() || "Etkinlik",
      paymentLabel: input.paymentLabel,
      eventId: (event?.id ?? enrollment.event_id) as string,
    };

    const results = await Promise.allSettled(
      recipients.map((to) => sendParentEnrollmentAdminEmail(to, payload)),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[admin enrollment notify] send failed", result.reason);
      }
    }
  } catch (error) {
    console.error("[admin enrollment notify]", error);
  }
}

export function scheduleAdminParentEnrollmentNotify(
  client: SupabaseClient,
  input: {
    enrollmentId: string;
    paymentLabel: string;
    alreadyEnrolled?: boolean;
    alreadyPaid?: boolean;
  },
): void {
  void notifyAdminOfParentEnrollment(client, input);
}
