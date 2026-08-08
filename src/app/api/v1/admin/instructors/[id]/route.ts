import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminInstructorRepository } from "@/infrastructure/repositories/supabase-admin-instructor-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;
  const body = (await request.json()) as { isActive?: boolean };

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  try {
    const repository = new SupabaseAdminInstructorRepository(access.client);
    await repository.setActive(id, body.isActive);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiCatchResponse(error, "Durum güncellenemedi.", {
      logLabel: "[admin/instructors PATCH]",
      status: 400,
    });
  }
}
