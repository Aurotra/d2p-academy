import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendStuckCardWarningEmail } from "@/infrastructure/email/stuck-card-warning-email";
import { isResendConfigured } from "@/infrastructure/email/send-resend-email";
import {
  classifyAdminPaymentMethod,
  isStuckCardPayment,
  resolveStuckCardSweepAction,
} from "@/infrastructure/payments/admin-payment-ledger";
import {
  releaseStuckCardPayment,
  StuckPaymentNotActionableError,
} from "@/infrastructure/payments/resolve-stuck-card-payment";

const SWEEP_LIMIT = 40;

type SweepPaymentRow = {
  id: string;
  status: string;
  provider: string | null;
  created_at: string;
  stuck_warned_at: string | null;
  stuck_released_at: string | null;
  payer_user_id: string;
  student_user_id: string;
  event_id: string;
  enrollments:
    | { status: string }
    | Array<{ status: string }>
    | null;
};

export type StuckCardSweepResult = {
  scanned: number;
  warned: number;
  released: number;
  skipped: number;
  errors: number;
};

function enrollmentStatusOf(row: SweepPaymentRow): string {
  const enrollment = Array.isArray(row.enrollments) ? row.enrollments[0] : row.enrollments;
  return String(enrollment?.status ?? "");
}

function displayName(profile: { full_name?: string | null; username?: string | null } | null, fallback: string) {
  return profile?.full_name?.trim() || profile?.username?.trim() || fallback;
}

async function markWarned(client: SupabaseClient, paymentId: string, at: string): Promise<void> {
  const { error } = await client
    .from("payments")
    .update({ stuck_warned_at: at })
    .eq("id", paymentId)
    .is("stuck_warned_at", null);
  if (error) {
    throw new Error(error.message);
  }
}

async function markReleased(client: SupabaseClient, paymentId: string, at: string): Promise<void> {
  const { error } = await client
    .from("payments")
    .update({ stuck_released_at: at })
    .eq("id", paymentId)
    .is("stuck_released_at", null);
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveWarnRecipient(
  client: SupabaseClient,
  row: SweepPaymentRow,
): Promise<{
  email: string | null;
  parentName: string;
  studentName: string;
  eventTitle: string;
}> {
  const { data: student } = await client
    .from("profiles")
    .select("full_name, email, parent_id, username")
    .eq("id", row.student_user_id)
    .maybeSingle();

  let parentName = "Veli";
  let email = student?.email?.trim() || null;

  if (student?.parent_id) {
    const { data: parent } = await client
      .from("profiles")
      .select("full_name, email, username")
      .eq("id", student.parent_id)
      .maybeSingle();
    parentName = displayName(parent, parentName);
    email = parent?.email?.trim() || email;
  }

  if (!email) {
    const { data: payer } = await client
      .from("profiles")
      .select("full_name, email, username")
      .eq("id", row.payer_user_id)
      .maybeSingle();
    parentName = displayName(payer, parentName);
    email = payer?.email?.trim() || null;
  }

  const { data: event } = await client
    .from("events")
    .select("title")
    .eq("id", row.event_id)
    .maybeSingle();

  return {
    email,
    parentName,
    studentName: displayName(student, "Öğrenci"),
    eventTitle: event?.title?.trim() || "Etkinlik",
  };
}

async function warnStuckCard(
  client: SupabaseClient,
  row: SweepPaymentRow,
  nowIso: string,
): Promise<"warned" | "skipped"> {
  if (row.stuck_warned_at) {
    return "skipped";
  }

  const recipient = await resolveWarnRecipient(client, row);
  if (!recipient.email) {
    await markWarned(client, row.id, nowIso);
    console.warn("[stuck-card sweep] no recipient email; marked warned", row.id);
    return "warned";
  }

  if (!isResendConfigured()) {
    console.warn("[stuck-card sweep] RESEND_API_KEY missing; warn deferred", row.id);
    return "skipped";
  }

  await sendStuckCardWarningEmail(recipient.email, {
    parentName: recipient.parentName,
    studentName: recipient.studentName,
    eventTitle: recipient.eventTitle,
    eventId: row.event_id,
    paymentFailed: row.status === "failed",
  });
  await markWarned(client, row.id, nowIso);
  return "warned";
}

export async function sweepStuckCardPayments(
  client: SupabaseClient,
  nowMs = Date.now(),
): Promise<StuckCardSweepResult> {
  const result: StuckCardSweepResult = {
    scanned: 0,
    warned: 0,
    released: 0,
    skipped: 0,
    errors: 0,
  };

  const { data, error } = await client
    .from("payments")
    .select(
      "id, status, provider, created_at, stuck_warned_at, stuck_released_at, payer_user_id, student_user_id, event_id, enrollments!inner(status)",
    )
    .in("status", ["pending", "failed"])
    .eq("enrollments.status", "pending_payment")
    .is("stuck_released_at", null)
    .order("created_at", { ascending: true })
    .limit(SWEEP_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const nowIso = new Date(nowMs).toISOString();
  const rows = (data ?? []) as SweepPaymentRow[];
  result.scanned = rows.length;

  for (const row of rows) {
    const method = classifyAdminPaymentMethod({ provider: row.provider });
    const isStuck = isStuckCardPayment({
      method,
      paymentStatus: String(row.status),
      enrollmentStatus: enrollmentStatusOf(row),
      createdAt: row.created_at,
      nowMs,
    });
    const action = resolveStuckCardSweepAction({
      isStuck,
      createdAt: row.created_at,
      warnedAt: row.stuck_warned_at,
      releasedAt: row.stuck_released_at,
      nowMs,
    });

    try {
      if (action === "warn") {
        const outcome = await warnStuckCard(client, row, nowIso);
        if (outcome === "warned") result.warned += 1;
        else result.skipped += 1;
        continue;
      }

      if (action === "release") {
        await releaseStuckCardPayment(client, row.id);
        await markReleased(client, row.id, nowIso);
        result.released += 1;
        continue;
      }

      result.skipped += 1;
    } catch (sweepError) {
      if (sweepError instanceof StuckPaymentNotActionableError) {
        result.skipped += 1;
        continue;
      }
      result.errors += 1;
      console.error("[stuck-card sweep]", row.id, sweepError);
    }
  }

  return result;
}
