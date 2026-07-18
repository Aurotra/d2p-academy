import { NextResponse } from "next/server";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";

const ALLOWED_STATUSES: EnrollmentStatus[] = [
  "registered",
  "attended",
  "completed",
  "cancelled",
  "no_show",
];

interface UpdateEnrollmentBody {
  enrollmentId?: string;
  enrollmentIds?: string[];
  status?: EnrollmentStatus;
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

export async function PATCH(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as UpdateEnrollmentBody;
    const status = body.status;
    const enrollmentIds = collectIds(body);

    if (enrollmentIds.length === 0 || !status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz kayıt veya durum." }, { status: 400 });
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
      .select("id, status, completed_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Durum güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as DeleteEnrollmentBody;
    const enrollmentIds = collectIds(body);
    const reason = body.reason?.trim() || null;

    if (enrollmentIds.length === 0) {
      return NextResponse.json({ error: "Silinecek kayıt seçilmedi." }, { status: 400 });
    }

    const {
      data: { user },
    } = await access.client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const { data: rows, error: fetchError } = await access.client
      .from("enrollments")
      .select(
        `
        id,
        status,
        user_id,
        event_id,
        student_code,
        profiles ( full_name, email ),
        events ( title ),
        certificates ( id, status, certificate_code )
      `,
      )
      .in("id", enrollmentIds);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    const blocked = (rows ?? []).filter((row) => {
      const certificates = Array.isArray(row.certificates)
        ? row.certificates
        : row.certificates
          ? [row.certificates]
          : [];
      return certificates.some(
        (certificate) => (certificate as { status?: string }).status === "active",
      );
    });

    if (blocked.length > 0) {
      return NextResponse.json(
        {
          error:
            "Aktif sertifikası olan kayıt silinemez. Önce Sertifikalar sayfasından sertifikayı iptal edin.",
        },
        { status: 400 },
      );
    }

    const audit = new SupabaseAdminAuditLogRepository(access.client);
    const { data: actorProfile } = await access.client
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    for (const row of rows ?? []) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const event = Array.isArray(row.events) ? row.events[0] : row.events;

      await audit.logEnrollmentDeleted({
        actorId: user.id,
        actorEmail: actorProfile?.email ?? user.email ?? null,
        reason,
        enrollmentId: row.id as string,
        eventId: (row.event_id as string) ?? null,
        eventTitle: (event as { title?: string } | null)?.title ?? null,
        studentId: (row.user_id as string) ?? null,
        studentName: (profile as { full_name?: string } | null)?.full_name ?? null,
        studentEmail: (profile as { email?: string } | null)?.email ?? null,
        metadata: {
          previous_status: row.status,
          student_code: row.student_code,
        },
      });
    }

    const { error: deleteError } = await access.client
      .from("enrollments")
      .delete()
      .in("id", enrollmentIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ data: { deleted: enrollmentIds.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
