import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  program_code: z.string().min(2).max(4),
  start_date: z
    .string()
    .optional()
    .nullable(),
  end_date: z
    .string()
    .optional()
    .nullable(),
  title: z.string().trim().min(2).max(120).optional(),
  capacity: z.number().int().positive().optional().nullable(),
});

const bodySchema = z.object({
  demand_request_ids: z.array(z.string().uuid()).min(1),
  event: eventSchema,
});

function toTimestamptz(value: string, endOfDay = false): string {
  if (value.includes("T")) {
    return new Date(value).toISOString();
  }

  return endOfDay
    ? new Date(`${value}T20:59:59+03:00`).toISOString()
    : new Date(`${value}T09:00:00+03:00`).toISOString();
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz dönüştürme verisi." }, { status: 400 });
  }

  const programCode = tryNormalizeProgramCode(parsed.data.event.program_code);
  if (!programCode) {
    return NextResponse.json({ error: "Geçersiz program kodu." }, { status: 400 });
  }

  const existingEventId = parsed.data.event.id ?? null;
  let startAt: string | null = null;
  let endAt: string | null = null;

  if (!existingEventId) {
    if (!parsed.data.event.start_date || !parsed.data.event.end_date) {
      return NextResponse.json(
        { error: "Yeni etkinlik için başlangıç ve bitiş tarihi gerekli." },
        { status: 400 },
      );
    }

    startAt = toTimestamptz(parsed.data.event.start_date);
    endAt = toTimestamptz(parsed.data.event.end_date, true);

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      return NextResponse.json({ error: "Bitiş tarihi başlangıçtan sonra olmalı." }, { status: 400 });
    }
  }

  const { data: result, error } = await access.client.rpc("convert_course_demand_requests", {
    p_demand_request_ids: parsed.data.demand_request_ids,
    p_event_id: existingEventId,
    p_program_code: existingEventId ? null : programCode,
    p_start_at: startAt,
    p_end_at: endAt,
    p_title: parsed.data.event.title ?? null,
    p_capacity: parsed.data.event.capacity ?? null,
  });

  if (error) {
    console.error("[course-demand convert]", error.message);
    return NextResponse.json({ error: "Dönüştürme başarısız." }, { status: 500 });
  }

  return NextResponse.json({ data: result });
}
