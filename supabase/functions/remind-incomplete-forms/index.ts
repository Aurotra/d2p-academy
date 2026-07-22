import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

import {
  buildIncompleteFormsReminderEmail,
  sendResendEmail,
} from "./email-templates.ts";
import {
  getMissingFormLabels,
  isEnrollmentFormsComplete,
  type ConsentRecordSnapshot,
} from "./form-status.ts";

const SITE_URL = "https://www.d2p.com.tr";
const FIRST_REMINDER_HOURS = 24;
const BEFORE_EVENT_DAYS = 3;

type ReminderType = "day_after_enrollment" | "before_event";

interface EnrollmentRow {
  id: string;
  user_id: string;
  created_at: string;
  intake_form_completed_at: string | null;
  pre_test_completed_at: string | null;
  post_test_completed_at: string | null;
  status: string;
  event_id: string;
}

interface EventRow {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  parent_id: string | null;
  grade_level: string | null;
}

interface ReminderLogRow {
  enrollment_id: string;
  reminder_type: ReminderType;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function hoursSince(isoDate: string, now: Date): number {
  return (now.getTime() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function daysUntil(isoDate: string, now: Date): number {
  return (new Date(isoDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
}

function buildFormsUrl(studentId: string, enrollmentId: string, parentId: string | null): string {
  if (parentId) {
    return `${SITE_URL}/dashboard/children/${studentId}/enrollments/${enrollmentId}/forms`;
  }
  return `${SITE_URL}/dashboard/enrollments/${enrollmentId}/forms`;
}

function pickReminderType(
  enrollment: EnrollmentRow,
  event: EventRow,
  sentTypes: Set<ReminderType>,
  now: Date,
): ReminderType | null {
  const daysToEvent = daysUntil(event.start_at, now);

  if (
    daysToEvent <= BEFORE_EVENT_DAYS &&
    daysToEvent > 0 &&
    !sentTypes.has("before_event")
  ) {
    return "before_event";
  }

  if (
    hoursSince(enrollment.created_at, now) >= FIRST_REMINDER_HOURS &&
    !sentTypes.has("day_after_enrollment")
  ) {
    return "day_after_enrollment";
  }

  return null;
}

async function resolveRecipientEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  student: ProfileRow,
  parentById: Map<string, ProfileRow>,
): Promise<{ email: string; name: string } | null> {
  if (student.parent_id) {
    const parent = parentById.get(student.parent_id);
    if (parent?.email) {
      return { email: parent.email, name: parent.full_name ?? "Veli" };
    }

    const { data: authParent } = await supabaseAdmin.auth.admin.getUserById(student.parent_id);
    if (authParent.user?.email) {
      return { email: authParent.user.email, name: parent?.full_name ?? "Veli" };
    }
    return null;
  }

  if (student.email) {
    return { email: student.email, name: student.full_name ?? "Öğrenci" };
  }

  const { data: authStudent } = await supabaseAdmin.auth.admin.getUserById(student.id);
  if (authStudent.user?.email) {
    return { email: authStudent.user.email, name: student.full_name ?? "Öğrenci" };
  }

  return null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const incomingSecret = request.headers.get("x-webhook-secret");

  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date();

    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from("enrollments")
      .select(
        "id, user_id, created_at, intake_form_completed_at, pre_test_completed_at, post_test_completed_at, status, event_id",
      )
      .in("status", ["registered", "attended"]);

    if (enrollmentsError) {
      throw new Error(`Kayıtlar alınamadı: ${enrollmentsError.message}`);
    }

    const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
    if (enrollmentRows.length === 0) {
      return jsonResponse({ ok: true, sent: 0, skipped: 0, checked: 0 });
    }

    const enrollmentIds = enrollmentRows.map((row) => row.id);
    const eventIds = [...new Set(enrollmentRows.map((row) => row.event_id))];
    const studentIds = [...new Set(enrollmentRows.map((row) => row.user_id))];

    const [
      { data: events, error: eventsError },
      { data: students, error: studentsError },
      { data: consents, error: consentsError },
      { data: reminderLogs, error: logsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("id, title, start_at, end_at, status")
        .in("id", eventIds),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, parent_id, grade_level")
        .in("id", studentIds),
      supabaseAdmin
        .from("consent_records")
        .select("enrollment_id, form_type, accepted, media_permissions")
        .in("enrollment_id", enrollmentIds),
      supabaseAdmin
        .from("form_reminder_logs")
        .select("enrollment_id, reminder_type")
        .in("enrollment_id", enrollmentIds),
    ]);

    if (eventsError) throw new Error(`Etkinlikler alınamadı: ${eventsError.message}`);
    if (studentsError) throw new Error(`Profiller alınamadı: ${studentsError.message}`);
    if (consentsError) throw new Error(`Onaylar alınamadı: ${consentsError.message}`);
    if (logsError) throw new Error(`Hatırlatma logları alınamadı: ${logsError.message}`);

    const eventById = new Map(((events ?? []) as EventRow[]).map((row) => [row.id, row]));
    const studentById = new Map(((students ?? []) as ProfileRow[]).map((row) => [row.id, row]));

    const parentIds = [...new Set(
      ((students ?? []) as ProfileRow[])
        .map((row) => row.parent_id)
        .filter((id): id is string => Boolean(id)),
    )];

    const parentById = new Map<string, ProfileRow>();
    if (parentIds.length > 0) {
      const { data: parents, error: parentsError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, parent_id, grade_level")
        .in("id", parentIds);

      if (parentsError) {
        throw new Error(`Veli profilleri alınamadı: ${parentsError.message}`);
      }

      for (const parent of (parents ?? []) as ProfileRow[]) {
        parentById.set(parent.id, parent);
      }
    }

    const consentsByEnrollment = new Map<string, ConsentRecordSnapshot[]>();
    for (const row of consents ?? []) {
      const list = consentsByEnrollment.get(row.enrollment_id) ?? [];
      list.push({
        form_type: row.form_type,
        accepted: Boolean(row.accepted),
        media_permissions: row.media_permissions as Record<string, boolean> | null,
      });
      consentsByEnrollment.set(row.enrollment_id, list);
    }

    const sentTypesByEnrollment = new Map<string, Set<ReminderType>>();
    for (const row of (reminderLogs ?? []) as ReminderLogRow[]) {
      const set = sentTypesByEnrollment.get(row.enrollment_id) ?? new Set<ReminderType>();
      set.add(row.reminder_type);
      sentTypesByEnrollment.set(row.enrollment_id, set);
    }

    let sent = 0;
    let skipped = 0;

    for (const enrollment of enrollmentRows) {
      const event = eventById.get(enrollment.event_id);
      const student = studentById.get(enrollment.user_id);

      if (!event || !student) {
        skipped += 1;
        continue;
      }

      if (event.status !== "published" || new Date(event.end_at) <= now) {
        skipped += 1;
        continue;
      }

      const consentRecords = consentsByEnrollment.get(enrollment.id) ?? [];
      const formsComplete = isEnrollmentFormsComplete({
        gradeLevel: student.grade_level,
        intakeFormCompletedAt: enrollment.intake_form_completed_at,
        preTestCompletedAt: enrollment.pre_test_completed_at,
        postTestCompletedAt: enrollment.post_test_completed_at,
        consentRecords,
      });

      if (formsComplete) {
        skipped += 1;
        continue;
      }

      const sentTypes = sentTypesByEnrollment.get(enrollment.id) ?? new Set<ReminderType>();
      const reminderType = pickReminderType(enrollment, event, sentTypes, now);

      if (!reminderType) {
        skipped += 1;
        continue;
      }

      const recipient = await resolveRecipientEmail(supabaseAdmin, student, parentById);
      if (!recipient) {
        skipped += 1;
        continue;
      }

      const missingForms = getMissingFormLabels({
        gradeLevel: student.grade_level,
        intakeFormCompletedAt: enrollment.intake_form_completed_at,
        preTestCompletedAt: enrollment.pre_test_completed_at,
        postTestCompletedAt: enrollment.post_test_completed_at,
        consentRecords,
      });

      const email = buildIncompleteFormsReminderEmail({
        recipientName: recipient.name,
        studentName: student.full_name ?? "Öğrenci",
        eventTitle: event.title,
        eventStartAt: event.start_at,
        missingForms,
        formsUrl: buildFormsUrl(student.id, enrollment.id, student.parent_id),
        reminderType,
      });

      await sendResendEmail({
        to: recipient.email,
        subject: email.subject,
        html: email.html,
      });

      const { error: logError } = await supabaseAdmin.from("form_reminder_logs").insert({
        enrollment_id: enrollment.id,
        reminder_type: reminderType,
        recipient_email: recipient.email,
      });

      if (logError) {
        throw new Error(`Hatırlatma logu yazılamadı: ${logError.message}`);
      }

      sent += 1;
    }

    return jsonResponse({
      ok: true,
      checked: enrollmentRows.length,
      sent,
      skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return jsonResponse({ error: message }, 500);
  }
});
