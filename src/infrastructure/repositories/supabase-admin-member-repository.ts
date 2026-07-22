import type { AdminMember, AdminMemberRole } from "@/core/domain/admin-member";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileMemberRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  is_active: boolean;
  is_instructor: boolean;
}

export interface ListAdminMembersInput {
  query?: string;
  role?: AdminMemberRole | "all";
}

export class SupabaseAdminMemberRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listMembers(input: ListAdminMembersInput = {}): Promise<AdminMember[]> {
    let request = this.client
      .from("profiles")
      .select("id, full_name, email, role, phone, created_at, is_active, is_instructor")
      .in("role", ["parent", "student"])
      .is("username", null)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (input.role && input.role !== "all") {
      request = request.eq("role", input.role);
    }

    const trimmedQuery = input.query?.trim();
    if (trimmedQuery) {
      const pattern = `%${trimmedQuery}%`;
      request = request.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
    }

    const { data, error } = await request;

    if (error) {
      throw new Error(`Üye listesi alınamadı: ${error.message}`);
    }

    const rows = (data ?? []) as ProfileMemberRow[];
    const childCountByParent = await this.countChildrenByParent(
      rows.filter((row) => row.role === "parent").map((row) => row.id),
    );

    return rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role as AdminMemberRole,
      phone: row.phone,
      createdAt: row.created_at,
      isActive: row.is_active,
      childCount: childCountByParent.get(row.id) ?? 0,
      isInstructor: row.is_instructor,
    }));
  }

  private async countChildrenByParent(parentIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (parentIds.length === 0) {
      return counts;
    }

    const { data, error } = await this.client
      .from("profiles")
      .select("parent_id")
      .in("parent_id", parentIds);

    if (error) {
      throw new Error(`Çocuk sayıları alınamadı: ${error.message}`);
    }

    for (const row of data ?? []) {
      if (!row.parent_id) {
        continue;
      }
      counts.set(row.parent_id, (counts.get(row.parent_id) ?? 0) + 1);
    }

    return counts;
  }
}
