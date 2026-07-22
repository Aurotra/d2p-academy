import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { demoteInstructorToMember } from "@/infrastructure/auth/set-user-role";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const member = await demoteInstructorToMember(id);
    return NextResponse.json({ data: member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Üye rolüne alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
