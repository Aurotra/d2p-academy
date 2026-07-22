import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "@/core/domain/auth";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: Profile["role"];
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
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
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (error || !data || data.role !== "instructor") {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, profile: mapProfile(data as ProfileRow) };
}

export function defaultDashboardPathForRole(role: string | null | undefined): string {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "instructor") {
    return "/instructor";
  }
  return "/dashboard";
}
