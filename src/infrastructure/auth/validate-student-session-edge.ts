import {
  STUDENT_SESSION_COOKIE,
  studentCookieOptions,
  verifyStudentSession,
  type StudentSessionPayload,
} from "@/infrastructure/auth/student-jwt";

/**
 * Edge-safe DB check for student JWT (no server-only / Node supabase client).
 * Compares JWT `sv` to profiles.student_session_version.
 */
export async function validateStudentSessionAgainstDb(
  payload: StudentSessionPayload,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return false;
  }

  const endpoint = new URL(`${url}/rest/v1/profiles`);
  endpoint.searchParams.set("id", `eq.${payload.sub}`);
  endpoint.searchParams.set("role", "eq.student");
  endpoint.searchParams.set("select", "student_session_version,is_active,username");

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const rows = (await response.json()) as Array<{
    student_session_version: number;
    is_active: boolean;
    username: string | null;
  }>;

  const row = rows[0];
  if (!row || row.is_active === false) {
    return false;
  }

  if (row.student_session_version !== payload.sv) {
    return false;
  }

  if (row.username && row.username !== payload.username) {
    return false;
  }

  return true;
}

export async function resolveStudentSessionFromToken(
  token: string | undefined,
): Promise<StudentSessionPayload | null> {
  if (!token) {
    return null;
  }

  const payload = await verifyStudentSession(token);
  if (!payload) {
    return null;
  }

  const valid = await validateStudentSessionAgainstDb(payload);
  return valid ? payload : null;
}

export function clearStudentSessionCookie(response: {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void };
}) {
  response.cookies.set(STUDENT_SESSION_COOKIE, "", {
    ...studentCookieOptions,
    maxAge: 0,
  });
}
