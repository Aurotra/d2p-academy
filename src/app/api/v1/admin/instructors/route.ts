import { NextResponse } from "next/server";

import type { InstructorOption } from "@/core/domain/admin-event";
import { createInstructorAccount } from "@/infrastructure/auth/create-instructor-account";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";

export async function GET() {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { data, error } = await access.client
    .from("profiles")
    .select("id, full_name, email")
    .or("is_instructor.eq.true,role.eq.instructor")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const instructors: InstructorOption[] = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? "",
  }));

  return NextResponse.json({ data: instructors });
}

export async function POST(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Ad soyad en az 2 karakter olmalıdır." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const instructor = await createInstructorAccount({ fullName, email, password });
    return NextResponse.json({ data: instructor }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eğitmen oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
