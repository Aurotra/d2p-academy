import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  hashStudentPassword,
  InvalidUsernameError,
  WeakPasswordError,
} from "@/infrastructure/auth/password";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { allocateUniqueStudentUsername } from "@/shared/utils/student-username";

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli doğum tarihi girin."),
  password: z.string().min(6).max(72),
});

function mapChildInsertError(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();

  if (error.code === "23505" || message.includes("duplicate")) {
    if (message.includes("username")) {
      return "Bu kullanıcı adı zaten kullanılıyor. Tekrar deneyin; sistem otomatik farklı bir ad üretir.";
    }
    return "Bu çocuk hesabı zaten kayıtlı görünüyor.";
  }

  if (error.code === "23503") {
    return "Veli hesabınız sistemde bulunamadı. Çıkış yapıp tekrar giriş yapın.";
  }

  if (message.includes("birth_date")) {
    return "Doğum tarihi alanı henüz sistemde aktif değil. Lütfen site yöneticisine bildirin.";
  }

  if (message.includes("student_password_hash") || message.includes("profiles_student_fields_check")) {
    return "Çocuk hesabı alanları eksik. Lütfen site yöneticisine bildirin.";
  }

  return "Çocuk eklenirken hata oluştu.";
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, created_at")
    .eq("role", "student")
    .eq("parent_id", auth.user.id)
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[parent/students GET]", error.message);
    return NextResponse.json({ error: "Çocuklar listelenirken hata oluştu." }, { status: 500 });
  }

  return NextResponse.json({ data: { students: data ?? [] } });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  await supabase.rpc("ensure_user_profile");

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  let passwordHash: string;
  try {
    passwordHash = await hashStudentPassword(parsed.data.password);
  } catch (e) {
    if (e instanceof WeakPasswordError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (service role)." },
      { status: 500 },
    );
  }

  const childPayload = {
    full_name: parsed.data.fullName.trim(),
    birth_date: parsed.data.birthDate,
    email: null,
    student_password_hash: passwordHash,
    parent_id: auth.user.id,
    role: "student" as const,
    student_session_version: 1,
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let username: string;
    try {
      username = await allocateUniqueStudentUsername(
        serviceClient,
        parsed.data.fullName,
        parsed.data.birthDate,
      );
    } catch (e) {
      if (e instanceof InvalidUsernameError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }

    const { data: created, error } = await serviceClient
      .from("profiles")
      .insert({ ...childPayload, username })
      .select("id, full_name, username, created_at")
      .single();

    if (!error) {
      return NextResponse.json({ data: { student: created } }, { status: 201 });
    }

    const duplicateUsername =
      error.code === "23505" && error.message.toLowerCase().includes("username");

    console.error("[parent/students POST]", error.code, error.message);

    if (duplicateUsername && attempt < 2) {
      continue;
    }

    return NextResponse.json({ error: mapChildInsertError(error) }, { status: 500 });
  }

  return NextResponse.json(
    { error: "Çocuk eklenirken hata oluştu. Lütfen tekrar deneyin." },
    { status: 500 },
  );
}
