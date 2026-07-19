import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { verifyStudentPassword } from "@/infrastructure/auth/password";
import {
  signStudentSession,
  STUDENT_SESSION_COOKIE,
  studentCookieOptions,
} from "@/infrastructure/auth/student-jwt";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
  password: z.string().min(1).max(200),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

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

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." },
        { status: 429 },
      );
    }

    const supabase = createServiceRoleClient();

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

    const token = await signStudentSession({
      studentId: student.id,
      username: student.username,
      parentId: student.parent_id,
      sessionVersion: student.student_session_version ?? 1,
    });

    // Drop any email Auth session so dual cookies do not confuse the header/panels.
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
