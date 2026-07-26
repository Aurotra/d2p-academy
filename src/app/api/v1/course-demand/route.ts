import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { tryNormalizeProgramCode } from "@/shared/utils/program-code";

const bodySchema = z
  .object({
    program_code: z.string().min(2).max(4),
    preferred_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferred_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    student_profile_id: z.string().uuid().optional().nullable(),
    student_name: z.string().trim().min(2).max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((data) => data.student_profile_id || data.student_name, {
    message: "Öğrenci seçin veya ad girin.",
  });

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await client.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi." },
      { status: 400 },
    );
  }

  const programCode = tryNormalizeProgramCode(parsed.data.program_code);
  if (!programCode) {
    return NextResponse.json({ error: "Geçersiz program kodu." }, { status: 400 });
  }

  const studentProfileId = parsed.data.student_profile_id ?? null;
  const studentName = parsed.data.student_name?.trim() || null;

  if (studentProfileId) {
    const { data: child, error: childError } = await client
      .from("profiles")
      .select("id")
      .eq("id", studentProfileId)
      .eq("parent_id", auth.user.id)
      .eq("role", "student")
      .not("username", "is", null)
      .maybeSingle();

    if (childError) {
      return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
    }
    if (!child) {
      return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
    }
  }

  const preferredEndDate =
    parsed.data.preferred_end_date && parsed.data.preferred_end_date !== parsed.data.preferred_start_date
      ? parsed.data.preferred_end_date
      : null;

  const { data: inserted, error: insertError } = await client
    .from("course_demand_requests")
    .insert({
      submitted_by_profile_id: auth.user.id,
      student_profile_id: studentProfileId,
      student_name: studentProfileId ? null : studentName,
      program_code: programCode,
      preferred_start_date: parsed.data.preferred_start_date,
      preferred_end_date: preferredEndDate,
      notes: parsed.data.notes ?? null,
      status: "pending",
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Bu öğrenci için bu programa zaten bekleyen bir talep var." },
        { status: 409 },
      );
    }
    console.error("[course-demand POST]", insertError.message);
    return NextResponse.json({ error: "Talep oluşturulamadı." }, { status: 500 });
  }

  const [{ data: parentProfile }, { data: program }] = await Promise.all([
    client.from("profiles").select("full_name, email").eq("id", auth.user.id).maybeSingle(),
    client.from("programs").select("name").eq("program_code", programCode).maybeSingle(),
  ]);

  let resolvedStudentName = studentName;
  if (studentProfileId && !resolvedStudentName) {
    const { data: child } = await client
      .from("profiles")
      .select("full_name")
      .eq("id", studentProfileId)
      .maybeSingle();
    resolvedStudentName = child?.full_name ?? null;
  }

  void logMemberActivity({
    action: "course_demand_submitted",
    actorId: auth.user.id,
    actorEmail: parentProfile?.email ?? auth.user.email ?? null,
    actorName: parentProfile?.full_name ?? null,
    studentId: studentProfileId,
    studentName: resolvedStudentName,
    metadata: {
      request_id: inserted.id,
      program_code: programCode,
      program_title: program?.name ?? programCode,
      preferred_start_date: parsed.data.preferred_start_date,
      preferred_end_date: preferredEndDate,
    },
  });

  return NextResponse.json({ data: inserted }, { status: 201 });
}
