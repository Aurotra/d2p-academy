import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashStudentPassword, WeakPasswordError } from "@/infrastructure/auth/password";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

const schema = z.object({ password: z.string().min(6).max(72) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: studentId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz şifre." }, { status: 400 });
  }

  const { data: child, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", auth.user.id)
    .eq("role", "student")
    .not("username", "is", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[reset-password lookup]", lookupError.message);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
  if (!child) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
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

  // student_session_version is bumped by DB trigger on hash change
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({
      student_password_hash: passwordHash,
    })
    .eq("id", studentId)
    .eq("parent_id", auth.user.id);

  if (updateError) {
    console.error("[reset-password update]", updateError.message);
    return NextResponse.json({ error: "Şifre sıfırlanamadı." }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
