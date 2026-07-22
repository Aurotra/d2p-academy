import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminInstructorRecord } from "@/core/domain/admin-instructor";

interface InstructorRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
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

export class SupabaseAdminInstructorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listAll(): Promise<AdminInstructorRecord[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at, is_instructor")
      .or("is_instructor.eq.true,role.eq.instructor")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Eğitmenler alınamadı: ${error.message}`);
    }

    return (data as InstructorRow[]).map(mapInstructor);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .or("is_instructor.eq.true,role.eq.instructor");

    if (error) {
      throw new Error(`Eğitmen durumu güncellenemedi: ${error.message}`);
    }
  }
}
