import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

/** Lightweight instructor picker for presentation assignments. */
export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const service = createServiceRoleClient();
    const { data, error } = await service
      .from("profiles")
      .select("id, full_name, email, role, is_instructor, is_active")
      .eq("is_active", true)
      .or("is_instructor.eq.true,role.eq.instructor")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      data: (data ?? []).map((row) => ({
        id: row.id as string,
        fullName: (row.full_name as string) || "Eğitmen",
        email: (row.email as string) || "",
      })),
    });
  } catch (error) {
    console.error("[admin instructor options]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eğitmenler alınamadı." },
      { status: 500 },
    );
  }
}
