import { NextResponse } from "next/server";

import { requireInstructorApiAccess } from "@/infrastructure/auth/require-instructor-api-access";
import { SupabasePresentationRepository } from "@/infrastructure/repositories/supabase-presentation-repository";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function GET() {
  const access = await requireInstructorApiAccess();
  if (access.response) return access.response;

  try {
    const service = createServiceRoleClient();
    const repo = new SupabasePresentationRepository(service);
    const items = await repo.listForInstructor(access.profile.id);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[instructor presentations GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sunumlar alınamadı." },
      { status: 500 },
    );
  }
}
