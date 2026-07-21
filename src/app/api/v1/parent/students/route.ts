import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  hashStudentPassword,
  InvalidUsernameError,
  WeakPasswordError,
} from "@/infrastructure/auth/password";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { buildStudentUsernameFromIdentity } from "@/shared/utils/student-username";
import type { SupabaseClient } from "@supabase/supabase-js";

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli doğum tarihi girin."),
  password: z.string().min(6).max(72),
});

async function allocateUniqueUsername(
  client: SupabaseClient,
  fullName: string,
  birthDate: string,
): Promise<string> {
  const base = buildStudentUsernameFromIdentity(fullName, birthDate);
  let candidate = base;
  let suffix = 2;

  while (suffix < 100) {
    const { data } = await client
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }

    const suffixText = String(suffix);
    candidate = `${base.slice(0, 32 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  throw new InvalidUsernameError(
    "Bu bilgilerle benzersiz kullanıcı adı oluşturulamadı. Lütfen destek ile iletişime geçin.",
  );
}

function mapChildInsertError(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();

  if (error.code === "23505" || message.includes("duplicate")) {
    if (message.includes("username")) {
      return "Bu kullanıcı adı zaten kullanılıyor. Ad/soyad veya doğum tarihini değiştirip tekrar deneyin.";
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

  let username: string;
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

  try {
    username = await allocateUniqueUsername(
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
    .insert({
      full_name: parsed.data.fullName.trim(),
      birth_date: parsed.data.birthDate,
      email: null,
      username,
      student_password_hash: passwordHash,
      parent_id: auth.user.id,
      role: "student",
      student_session_version: 1,
    })
    .select("id, full_name, username, created_at")
    .single();

  if (error) {
    console.error("[parent/students POST]", error.code, error.message);
    return NextResponse.json({ error: mapChildInsertError(error) }, { status: 500 });
  }

  return NextResponse.json({ data: { student: created } }, { status: 201 });
}
