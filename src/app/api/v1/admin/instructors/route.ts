import { NextResponse } from "next/server";

import type { InstructorOption } from "@/core/domain/admin-event";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { data, error } = await access.client
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "instructor")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const instructors: InstructorOption[] = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
  }));

  return NextResponse.json({ data: instructors });
}
