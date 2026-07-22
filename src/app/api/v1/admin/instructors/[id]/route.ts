import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminInstructorRepository } from "@/infrastructure/repositories/supabase-admin-instructor-repository";

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
    const message = error instanceof Error ? error.message : "Durum güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
