import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "@/core/domain/auth";
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: Profile["role"];
  is_instructor: boolean;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    isInstructor: row.is_instructor,
  };
}

export type InstructorAccessResult =
  | { authorized: true; profile: Profile }
  | { authorized: false; reason: "unauthenticated" | "forbidden" };

export async function getInstructorAccess(
  client: SupabaseClient,
): Promise<InstructorAccessResult> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, email, role, is_instructor")
    .eq("id", user.id)
    .single();

  if (error || !data || !profileHasInstructorCapability(data)) {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, profile: mapProfile(data as ProfileRow) };
}

export function defaultDashboardPathForRole(
  role: string | null | undefined,
  isInstructor?: boolean | null,
): string {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "instructor" || (isInstructor && role !== "parent" && role !== "student")) {
    return "/instructor";
  }
  return "/dashboard";
}
