import "server-only";

import { cookies } from "next/headers";

import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSession,
  type StudentSessionPayload,
} from "@/infrastructure/auth/student-jwt";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export async function getStudentSession(): Promise<StudentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyStudentSession(token);
  if (!payload) {
    return null;
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await service
    .from("profiles")
    .select("student_session_version, is_active, username")
    .eq("id", payload.sub)
    .eq("role", "student")
    .maybeSingle();

  if (error || !data || data.is_active === false) {
    return null;
  }

  if (data.student_session_version !== payload.sv) {
    return null;
  }

  if (data.username && data.username !== payload.username) {
    return null;
  }

  return payload;
}
