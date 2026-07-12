import { NextResponse } from "next/server";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";

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

export async function PATCH(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as UpdateEnrollmentBody;
    const status = body.status;

    const enrollmentIds = Array.from(
      new Set(
        [
          ...(body.enrollmentIds ?? []),
          ...(body.enrollmentId ? [body.enrollmentId] : []),
        ]
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    );

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
