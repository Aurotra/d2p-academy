import { NextResponse } from "next/server";

import { listEventCategories } from "@/core/use-cases/manage-admin-events";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminEventRepository } from "@/infrastructure/repositories/supabase-admin-event-repository";
import { apiCatchResponse } from "@/shared/utils/api-error";

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const repository = new SupabaseAdminEventRepository(access.client);
    const categories = await listEventCategories(repository);
    return NextResponse.json({ data: categories });
  } catch (error) {
    return apiCatchResponse(error, "Kategoriler alınamadı.", {
      logLabel: "[admin/event-categories GET]",
      status: 500,
    });
  }
}
