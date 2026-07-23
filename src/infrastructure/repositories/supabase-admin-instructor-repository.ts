import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminInstructorRecord } from "@/core/domain/admin-instructor";
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";

interface InstructorRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  is_instructor?: boolean | null;
}

function memberRoleLabel(role: string): string {
  if (role === "parent") return "Veli";
  if (role === "student") return "Üye öğrenci";
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Yalnızca eğitmen";
  return role;
}

function mapInstructor(row: InstructorRow): AdminInstructorRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? "—",
    memberRole: memberRoleLabel(row.role),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function isMissingInstructorColumnError(message: string): boolean {
  return message.includes("is_instructor") && message.includes("does not exist");
}

export class SupabaseAdminInstructorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listAll(): Promise<AdminInstructorRecord[]> {
    const baseSelect = "id, full_name, email, role, is_active, created_at";
    let { data: rawData, error } = await this.client
      .from("profiles")
      .select(`${baseSelect}, is_instructor`)
      .order("full_name", { ascending: true });
    let data = rawData as InstructorRow[] | null;

    if (error && isMissingInstructorColumnError(error.message)) {
      const fallback = await this.client.from("profiles").select(baseSelect).order("full_name", {
        ascending: true,
      });
      data = (fallback.data ?? null) as InstructorRow[] | null;
      error = fallback.error;
    }

    if (error) {
      throw new Error(`Eğitmenler alınamadı: ${error.message}`);
    }

    const rows = ((data ?? []) as InstructorRow[]).filter((row) =>
      profileHasInstructorCapability({
        role: row.role,
        is_instructor: row.is_instructor,
      }),
    );

    return rows.map(mapInstructor);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`Eğitmen durumu güncellenemedi: ${error.message}`);
    }
  }
}
