import { NextResponse } from "next/server";

import type { UpdateEventInput } from "@/core/domain/admin-event";
import { deleteAdminEvent, updateAdminEvent } from "@/core/use-cases/manage-admin-events";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminEventRepository } from "@/infrastructure/repositories/supabase-admin-event-repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<UpdateEventInput>;
    const repository = new SupabaseAdminEventRepository(access.client);
    const event = await updateAdminEvent(repository, { id, ...body });
    return NextResponse.json({ data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Etkinlik güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const { id } = await params;
    const repository = new SupabaseAdminEventRepository(access.client);
    await deleteAdminEvent(repository, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Etkinlik silinemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
