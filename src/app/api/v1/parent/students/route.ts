import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  hashStudentPassword,
  InvalidUsernameError,
  normalizeUsername,
  WeakPasswordError,
} from "@/infrastructure/auth/password";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z.string().trim().min(1).max(40),
  password: z.string().min(6).max(72),
});

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

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  let username: string;
  let passwordHash: string;
  try {
    username = normalizeUsername(parsed.data.username);
    passwordHash = await hashStudentPassword(parsed.data.password);
  } catch (e) {
    if (e instanceof WeakPasswordError || e instanceof InvalidUsernameError) {
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

  const { data: existing } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
  }

  const { data: created, error } = await serviceClient
    .from("profiles")
    .insert({
      full_name: parsed.data.fullName.trim(),
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
    console.error("[parent/students POST]", error.message);
    return NextResponse.json({ error: "Çocuk eklenirken hata oluştu." }, { status: 500 });
  }

  return NextResponse.json({ data: { student: created } }, { status: 201 });
}
