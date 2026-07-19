import { NextResponse } from "next/server";

import {
  STUDENT_SESSION_COOKIE,
  studentCookieOptions,
} from "@/infrastructure/auth/student-jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(STUDENT_SESSION_COOKIE, "", {
    ...studentCookieOptions,
    maxAge: 0,
  });
  return response;
}
