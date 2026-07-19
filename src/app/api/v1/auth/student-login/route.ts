import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  clearAuthRateLimit,
  isAuthRateLimited,
} from "@/infrastructure/auth/auth-rate-limit";
import { verifyStudentPassword } from "@/infrastructure/auth/password";
import {
  signStudentSession,
  STUDENT_SESSION_COOKIE,
  studentCookieOptions,
} from "@/infrastructure/auth/student-jwt";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const username = parsed.data.username.trim().toLowerCase();
    const rateLimitKey = `${ip}:${username}`;

    const supabase = createServiceRoleClient();

    if (await isAuthRateLimited(supabase, rateLimitKey)) {
      return NextResponse.json(
        { error: "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." },
        { status: 429 },
      );
    }

    const { data: student, error } = await supabase
      .from("profiles")
      .select(
        "id, username, parent_id, student_password_hash, full_name, student_session_version, is_active",
      )
      .eq("role", "student")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("[student-login] DB hatası:", error.message);
      return NextResponse.json({ error: "Giriş sırasında bir hata oluştu." }, { status: 500 });
    }

    const genericError = NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );

    if (!student || !student.student_password_hash || student.is_active === false) {
      return genericError;
    }

    if (!student.parent_id || !student.username) {
      return genericError;
    }

    const passwordOk = await verifyStudentPassword(
      parsed.data.password,
      student.student_password_hash,
    );
    if (!passwordOk) {
      return genericError;
    }

    await clearAuthRateLimit(supabase, rateLimitKey);

    const token = await signStudentSession({
      studentId: student.id,
      username: student.username,
      parentId: student.parent_id,
      sessionVersion: student.student_session_version ?? 1,
    });

    try {
      const emailClient = await createSupabaseServerClient();
      if (emailClient) {
        await emailClient.auth.signOut();
      }
    } catch {
      // ignore
    }

    const response = NextResponse.json({
      data: {
        student: {
          id: student.id,
          username: student.username,
          fullName: student.full_name,
        },
        redirectTo: "/student-dashboard",
      },
    });
    response.cookies.set(STUDENT_SESSION_COOKIE, token, studentCookieOptions);
    return response;
  } catch (err) {
    console.error("[student-login] beklenmeyen hata:", err);
    return NextResponse.json(
      { error: "Giriş sırasında beklenmeyen bir hata oluştu." },
      { status: 500 },
    );
  }
}
