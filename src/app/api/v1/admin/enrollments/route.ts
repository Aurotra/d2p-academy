import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { getAdminApiServiceClient } from "@/infrastructure/auth/get-admin-api-service-client";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import {
  CapacityFullError,
  tryReserveCapacityAndEnroll,
} from "@/infrastructure/enrollments/try-reserve-capacity-and-enroll";
import { softCancelEnrollmentsWithRefundGuard } from "@/infrastructure/enrollments/soft-cancel-enrollments-with-refund-guard";
import { removeEnrollmentsFromEvent } from "@/infrastructure/enrollments/remove-enrollments-from-event";
import { revalidateEventAttendancePaths } from "@/infrastructure/enrollments/revalidate-event-attendance";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";
import { resolveUsernameForLookup } from "@/shared/utils/student-username";
import { apiCatchResponse, logSupabaseError } from "@/shared/utils/api-error";

const ALLOWED_STATUSES: EnrollmentStatus[] = [
  "registered",
  "attended",
  "completed",
  "cancelled",
  "no_show",
];

const createSchema = z.object({
  eventId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  username: z.string().min(1).max(40).optional(),
  email: z.string().email().optional(),
  query: z.string().min(1).max(80).optional(),
});

interface UpdateEnrollmentBody {
  enrollmentId?: string;
  enrollmentIds?: string[];
  status?: EnrollmentStatus;
  reason?: string;
}

interface DeleteEnrollmentBody {
  enrollmentId?: string;
  enrollmentIds?: string[];
  reason?: string;
}

function collectIds(body: { enrollmentId?: string; enrollmentIds?: string[] }): string[] {
  return Array.from(
    new Set(
      [...(body.enrollmentIds ?? []), ...(body.enrollmentId ? [body.enrollmentId] : [])]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export async function POST(request: Request) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const json = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "eventId ve studentId veya username gerekli." },
        { status: 400 },
      );
    }

    const { eventId } = parsed.data;
    let studentId = parsed.data.studentId;
    const username = parsed.data.username?.trim().toLowerCase();
    const email = parsed.data.email?.trim().toLowerCase();
    const query = parsed.data.query?.trim().toLowerCase();

    if (!studentId && !username && !email && !query) {
      return NextResponse.json(
        { error: "Öğrenci kimliği, kullanıcı adı veya e-posta gerekli." },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await access.client
      .from("events")
      .select("id, status")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    let student: {
      id: string;
      full_name: string;
      email: string | null;
      username: string | null;
    } | null = null;

    if (studentId) {
      const { data, error } = await access.client
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("id", studentId)
        .maybeSingle();
      if (error) {
        logSupabaseError("[admin/enrollments POST]", error);
        return NextResponse.json({ error: "Öğrenci bilgisi alınamadı." }, { status: 400 });
      }
      student = data;
    } else if (username || (query && !query.includes("@"))) {
      const raw = username ?? query!;
      let lookup: string;
      try {
        lookup = resolveUsernameForLookup(raw);
      } catch {
        return NextResponse.json({ error: "Geçersiz kullanıcı adı." }, { status: 400 });
      }
      const { data, error } = await access.client
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("username", lookup)
        .maybeSingle();
      if (error) {
        logSupabaseError("[admin/enrollments POST]", error);
        return NextResponse.json({ error: "Öğrenci bilgisi alınamadı." }, { status: 400 });
      }
      student = data;
    } else {
      const lookup = email ?? query!;
      const { data, error } = await access.client
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("email", lookup)
        .maybeSingle();
      if (error) {
        logSupabaseError("[admin/enrollments POST]", error);
        return NextResponse.json({ error: "Öğrenci bilgisi alınamadı." }, { status: 400 });
      }
      student = data;
    }

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
    }

    studentId = student.id;

    try {
      const reserved = await tryReserveCapacityAndEnroll(access.client, {
        eventId,
        userId: studentId,
        targetStatus: "registered",
        enrollmentSource: "admin_manual",
      });

      if (reserved.alreadyEnrolled) {
        return NextResponse.json(
          {
            error: "Bu öğrenci zaten bu etkinliğe kayıtlı.",
            data: { enrollmentId: reserved.enrollmentId },
          },
          { status: 409 },
        );
      }

      const { data: enrollment, error: fetchError } = await access.client
        .from("enrollments")
        .select("id, status, user_id, event_id, registered_at, enrollment_source")
        .eq("id", reserved.enrollmentId)
        .single();

      if (fetchError || !enrollment) {
        logSupabaseError("[admin/enrollments POST fetch]", fetchError);
        return NextResponse.json({ error: "Kayıt eklenemedi." }, { status: 400 });
      }

      const { data: eventMeta } = await access.client
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();

      try {
        const audit = new SupabaseAdminAuditLogRepository(access.client);
        await audit.logEnrollmentCreated({
          actorId: access.user.id,
          actorEmail: access.actorEmail,
          enrollmentId: enrollment.id,
          eventId,
          eventTitle: eventMeta?.title ?? null,
          studentId: student.id,
          studentName: student.full_name,
          studentEmail: student.email,
          metadata: {
            enrollment_source: "admin_manual",
            revived: reserved.revived,
          },
        });
      } catch (auditError) {
        console.error("[admin/enrollments POST audit]", auditError);
      }

      return NextResponse.json(
        { data: { enrollment, student } },
        { status: reserved.revived ? 200 : 201 },
      );
    } catch (reserveError) {
      if (reserveError instanceof CapacityFullError) {
        return NextResponse.json({ error: reserveError.message }, { status: 409 });
      }
      throw reserveError;
    }
  } catch (error) {
    return apiCatchResponse(error, "Kayıt eklenemedi.", {
      logLabel: "[admin/enrollments POST]",
      status: 500,
    });
  }
}

export async function PATCH(request: Request) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as UpdateEnrollmentBody;
    const status = body.status;
    const enrollmentIds = collectIds(body);
    const reason = body.reason?.trim() || null;

    if (enrollmentIds.length === 0 || !status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz kayıt veya durum." }, { status: 400 });
    }

    if (status === "cancelled") {
      const result = await softCancelEnrollmentsWithRefundGuard(access.client, {
        enrollmentIds,
        actorId: access.user.id,
        reason,
      });

      revalidatePath("/admin/enrollments");
      revalidatePath("/admin/refund-followups");
      revalidateEventAttendancePaths([
        ...new Set(result.data.map((row) => row.event_id as string)),
      ]);

      return NextResponse.json({
        data: result.data,
        ...(result.paymentWarning
          ? {
              warning: result.paymentWarning.warning,
              message: result.paymentWarning.message,
              paidEnrollmentIds: result.paymentWarning.paidEnrollmentIds,
            }
          : {}),
      });
    }

    const payload: {
      status: EnrollmentStatus;
      completed_at: string | null;
    } = {
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    };

    const { data, error } = await access.client
      .from("enrollments")
      .update(payload)
      .in("id", enrollmentIds)
      .select("id, status, completed_at, event_id");

    if (error) {
      logSupabaseError("[admin/enrollments PATCH]", error);
      return NextResponse.json({ error: "Durum güncellenemedi." }, { status: 400 });
    }

    revalidatePath("/admin/enrollments");
    revalidateEventAttendancePaths([...new Set((data ?? []).map((row) => row.event_id as string))]);

    return NextResponse.json({ data });
  } catch (error) {
    return apiCatchResponse(error, "Durum güncellenemedi.", {
      logLabel: "[admin/enrollments PATCH]",
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as DeleteEnrollmentBody;
    const enrollmentIds = collectIds(body);
    const reason = body.reason?.trim() || null;

    const result = await removeEnrollmentsFromEvent(access.client, {
      enrollmentIds,
      actorId: access.user.id,
      actorEmail: access.actorEmail,
      reason,
    });

    revalidatePath("/admin/enrollments");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/admin/refund-followups");
    revalidateEventAttendancePaths(result.eventIds);

    return NextResponse.json({
      data: { removed: result.removed },
      ...(result.paymentWarning
        ? {
            warning: result.paymentWarning.warning,
            message: result.paymentWarning.message,
            paidEnrollmentIds: result.paymentWarning.paidEnrollmentIds,
          }
        : {}),
    });
  } catch (error) {
    return apiCatchResponse(error, "Kayıt kurstan çıkarılamadı.", {
      logLabel: "[admin/enrollments DELETE]",
      status: 400,
    });
  }
}
