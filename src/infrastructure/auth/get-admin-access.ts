import type { Profile } from "@/core/domain/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export type AdminAccessResult =
  | { authorized: true; profile: Profile }
  | { authorized: false; reason: "unauthenticated" | "forbidden" };

export async function getAdminAccess(client: SupabaseClient): Promise<AdminAccessResult> {
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

  if (error || !data || data.role !== "admin") {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, profile: mapProfile(data as ProfileRow) };
}
