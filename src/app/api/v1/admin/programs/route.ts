import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { createProgram, listPrograms } from "@/infrastructure/programs/program-repository";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";
import { apiCatchResponse, isPostgresUniqueViolation } from "@/shared/utils/api-error";

const createSchema = z.object({
  programCode: z.string().min(2).max(4),
  name: z.string().trim().min(2).max(120),
  durationWeeks: z.number().positive().optional().nullable(),
  durationHours: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const programs = await listPrograms(access.client);
    return NextResponse.json({ data: { programs } });
  } catch (error) {
    console.error("[admin programs GET]", error);
    return NextResponse.json({ error: "Programlar alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz program verisi." }, { status: 400 });
  }

  const programCode = tryNormalizeProgramCode(parsed.data.programCode);
  if (!programCode) {
    return NextResponse.json({ error: "Geçersiz program kodu." }, { status: 400 });
  }

  try {
    const program = await createProgram(access.client, {
      programCode,
      name: parsed.data.name,
      durationWeeks: parsed.data.durationWeeks ?? null,
      durationHours: parsed.data.durationHours ?? null,
      isActive: parsed.data.isActive ?? true,
    });

    return NextResponse.json({ data: { program } }, { status: 201 });
  } catch (error) {
    const status = isPostgresUniqueViolation(error) ? 409 : 500;
    const message = status === 409 ? "Bu program kodu zaten kullanılıyor." : "Program oluşturulamadı.";
    return apiCatchResponse(error, message, { logLabel: "[admin programs POST]", status });
  }
}
