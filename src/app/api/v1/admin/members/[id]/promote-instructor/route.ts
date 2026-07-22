import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { promoteMemberToInstructor } from "@/infrastructure/auth/set-user-role";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { id } = await context.params;

  try {
    const member = await promoteMemberToInstructor(id);
    return NextResponse.json({ data: member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eğitmen yetkisi verilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
