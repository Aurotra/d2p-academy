import type { SupabaseClient } from "@supabase/supabase-js";

export type ReserveTargetStatus = "registered" | "pending_payment";

/** How the enrollment seat was created (payments join still identifies iyzico). */
export type EnrollmentSource = "parent" | "self" | "admin_manual" | "unknown_legacy";

export class CapacityFullError extends Error {
  readonly code = "CAPACITY_FULL" as const;

  constructor(message: string) {
    super(message);
    this.name = "CapacityFullError";
  }
}

export class ReserveEnrollmentError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ReserveEnrollmentError";
    this.code = code;
  }
}

export interface ReserveEnrollmentResult {
  enrollmentId: string;
  alreadyEnrolled: boolean;
  revived: boolean;
  status: string;
}

interface ReserveRpcRow {
  ok?: boolean;
  enrollment_id?: string;
  already_enrolled?: boolean;
  revived?: boolean;
  status?: string;
  error_code?: string;
  error_message?: string;
}

/**
 * Atomically reserve a seat and create/revive enrollment (Postgres FOR UPDATE + capacity count).
 */
export async function tryReserveCapacityAndEnroll(
  client: SupabaseClient,
  input: {
    eventId: string;
    userId: string;
    targetStatus: ReserveTargetStatus;
    enrollmentSource: EnrollmentSource;
  },
): Promise<ReserveEnrollmentResult> {
  const { data, error } = await client.rpc("reserve_event_enrollment", {
    p_event_id: input.eventId,
    p_user_id: input.userId,
    p_target_status: input.targetStatus,
    p_enrollment_source: input.enrollmentSource,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? {}) as ReserveRpcRow;
  if (!row.ok) {
    const code = row.error_code ?? "RESERVE_FAILED";
    const message = row.error_message ?? "Kayıt oluşturulamadı.";
    if (code === "CAPACITY_FULL") {
      throw new CapacityFullError(message);
    }
    throw new ReserveEnrollmentError(code, message);
  }

  if (!row.enrollment_id) {
    throw new Error("Kayıt kimliği alınamadı.");
  }

  return {
    enrollmentId: row.enrollment_id,
    alreadyEnrolled: Boolean(row.already_enrolled),
    revived: Boolean(row.revived),
    status: row.status ?? input.targetStatus,
  };
}
