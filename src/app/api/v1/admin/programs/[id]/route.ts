import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { deleteProgram, updateProgram } from "@/infrastructure/programs/program-repository";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";

const updateSchema = z.object({
  programCode: z.string().min(2).max(4).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  durationWeeks: z.number().positive().optional().nullable(),
  durationHours: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz program verisi." }, { status: 400 });
  }

  let programCode: string | undefined;
  if (parsed.data.programCode) {
    const normalized = tryNormalizeProgramCode(parsed.data.programCode);
    if (!normalized) {
      return NextResponse.json({ error: "Geçersiz program kodu." }, { status: 400 });
    }
    programCode = normalized;
  }

  try {
    const program = await updateProgram(access.client, id, {
      programCode,
      name: parsed.data.name,
      durationWeeks: parsed.data.durationWeeks,
      durationHours: parsed.data.durationHours,
      isActive: parsed.data.isActive,
    });

    return NextResponse.json({ data: { program } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Program güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    await deleteProgram(access.client, id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Program silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
