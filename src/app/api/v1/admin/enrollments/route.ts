import { NextResponse } from "next/server";
import { z } from "zod";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { getEventCapacityBlockReason } from "@/infrastructure/enrollments/event-capacity";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";
import { tryNormalizeUsername } from "@/shared/utils/student-username";

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
  const access = await requireAdminApiAccess();
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
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      student = data;
    } else if (username || (query && !query.includes("@"))) {
      const raw = (username ?? query!).trim().toLowerCase();
      const lookup = tryNormalizeUsername(raw) ?? raw;
      const { data, error } = await access.client
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("role", "student")
        .eq("is_active", true)
        .eq("username", lookup)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
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
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      student = data;
    }

    if (!student) {
      return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
    }

    studentId = student.id;

    const { data: existing } = await access.client
      .from("enrollments")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", studentId)
      .maybeSingle();

    if (existing && existing.status !== "cancelled") {
      return NextResponse.json(
        { error: "Bu öğrenci zaten bu etkinliğe kayıtlı.", data: { enrollmentId: existing.id } },
        { status: 409 },
      );
    }

    const capacityBlock = await getEventCapacityBlockReason(access.client, eventId);
    if (capacityBlock) {
      return NextResponse.json({ error: capacityBlock }, { status: 409 });
    }

    if (existing?.status === "cancelled") {
      const { data: revived, error: reviveError } = await access.client
        .from("enrollments")
        .update({ status: "registered", completed_at: null })
        .eq("id", existing.id)
        .select("id, status, user_id, event_id, registered_at")
        .single();

      if (reviveError) {
        return NextResponse.json({ error: reviveError.message }, { status: 400 });
      }

      return NextResponse.json({ data: { enrollment: revived, student } }, { status: 200 });
    }

    const { data: enrollment, error: insertError } = await access.client
      .from("enrollments")
      .insert({
        event_id: eventId,
        user_id: studentId,
        status: "registered",
      })
      .select("id, status, user_id, event_id, registered_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ data: { enrollment, student } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt eklenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
