import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { after } from "next/server";

import {
  parseAdminNotificationEmails,
  shouldNotifyAdminOfEnrollment,
} from "@/infrastructure/email/admin-enrollment-notify";
import { sendParentEnrollmentAdminEmail } from "@/infrastructure/email/parent-enrollment-admin-email";

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
 * Idempotent via enrollments.admin_notified_at so PayTR retries can recover missed sends.
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
    // alreadyPaid must NOT skip mail — payment may already be marked paid while
    // the first notify attempt failed (Vercel freeze / missing RESEND on host).
    if (input.alreadyEnrolled) {
      return;
    }

    const enrollmentSelectWithFlag = `
        id,
        status,
        enrollment_source,
        user_id,
        event_id,
        admin_notified_at,
        events ( id, title ),
        profiles ( id, full_name, email, parent_id, parent_phone, username )
      `;
    const enrollmentSelectBase = `
        id,
        status,
        enrollment_source,
        user_id,
        event_id,
        events ( id, title ),
        profiles ( id, full_name, email, parent_id, parent_phone, username )
      `;

    let enrollmentQuery = await client
      .from("enrollments")
      .select(enrollmentSelectWithFlag)
      .eq("id", input.enrollmentId)
      .maybeSingle();

    // Migration may not be applied yet — still send mail without idempotency flag.
    if (
      enrollmentQuery.error &&
      /admin_notified_at/i.test(enrollmentQuery.error.message)
    ) {
      enrollmentQuery = await client
        .from("enrollments")
        .select(enrollmentSelectBase)
        .eq("id", input.enrollmentId)
        .maybeSingle();
    }

    const { data: enrollment, error: enrollmentError } = enrollmentQuery;

    if (enrollmentError || !enrollment) {
      console.error(
        "[admin enrollment notify] enrollment lookup failed",
        enrollmentError?.message ?? "missing row",
      );
      return;
    }

    if (
      "admin_notified_at" in enrollment &&
      (enrollment as { admin_notified_at?: string | null }).admin_notified_at
    ) {
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
    let sent = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[admin enrollment notify] send failed", result.reason);
      } else {
        sent += 1;
      }
    }
    if (sent > 0) {
      const { error: markError } = await client
        .from("enrollments")
        .update({ admin_notified_at: new Date().toISOString() })
        .eq("id", input.enrollmentId)
        .is("admin_notified_at", null);
      if (markError) {
        console.error("[admin enrollment notify] mark notified failed", markError.message);
      }
      console.info("[admin enrollment notify] sent", {
        enrollmentId: input.enrollmentId,
        recipients: recipients.length,
        sent,
        paymentLabel: input.paymentLabel,
      });
    }
  } catch (error) {
    console.error("[admin enrollment notify]", error);
  }
}

/**
 * Schedules admin mail after the HTTP response via Next.js `after()` so Vercel
 * keeps the invocation alive. Prefer `await notifyAdminOfParentEnrollment` on
 * payment webhooks where delivery must not race the response.
 */
export function scheduleAdminParentEnrollmentNotify(
  client: SupabaseClient,
  input: {
    enrollmentId: string;
    paymentLabel: string;
    alreadyEnrolled?: boolean;
    alreadyPaid?: boolean;
  },
): void {
  try {
    after(() => notifyAdminOfParentEnrollment(client, input));
  } catch (error) {
    console.warn(
      "[admin enrollment notify] after() unavailable; running inline",
      error instanceof Error ? error.message : error,
    );
    void notifyAdminOfParentEnrollment(client, input);
  }
}
