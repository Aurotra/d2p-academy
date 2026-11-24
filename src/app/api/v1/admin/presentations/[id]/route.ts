import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      category?: string;
      pageCount?: number;
      isPublished?: boolean;
      instructorIds?: string[];
    };

    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);
    const updated = await repo.update(id, {
      title: body.title,
      description: body.description,
      category: body.category,
      pageCount: body.pageCount,
      isPublished: body.isPublished,
      instructorIds: body.instructorIds,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[admin presentations PATCH]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunum güncellenemedi." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const { id } = await context.params;
    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);
    const existing = await repo.getById(id);
    if (!existing) {
      return NextResponse.json({ error: "Sunum bulunamadı." }, { status: 404 });
    }

    await repo.softDelete(id);

    try {
      await service.storage.from("presentations").remove([existing.storagePath]);
    } catch (storageError) {
      console.warn("[admin presentations DELETE storage]", storageError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin presentations DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunum silinemedi." },
      { status: 500 },
    );
  }
}
