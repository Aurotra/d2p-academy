import { NextResponse } from "next/server";

import {
  STUDENT_SESSION_COOKIE,
  studentCookieOptions,
} from "@/infrastructure/auth/student-jwt";

/** Clear username-student JWT cookie on a route Response. */
export function clearStudentSessionCookie(response: NextResponse): void {
  response.cookies.set(STUDENT_SESSION_COOKIE, "", {
    ...studentCookieOptions,
    maxAge: 0,
  });
}
