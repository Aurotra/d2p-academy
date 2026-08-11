import type { AdminMember, AdminMemberRole } from "@/core/domain/admin-member";
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";
import { resolveContactPhone } from "@/shared/utils/resolve-contact-phone";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileMemberRow {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  phone: string | null;
  parent_phone: string | null;
  created_at: string;
  is_active: boolean;
  is_instructor?: boolean | null;
}

export interface ListAdminMembersInput {
  query?: string;
  role?: AdminMemberRole | "all";
}

function isMissingInstructorColumnError(message: string): boolean {
  return message.includes("is_instructor") && message.includes("does not exist");
}

export class SupabaseAdminMemberRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listMembers(input: ListAdminMembersInput = {}): Promise<AdminMember[]> {
    const baseSelect =
      "id, full_name, email, role, phone, parent_phone, created_at, is_active";
    let request = this.client
      .from("profiles")
      .select(`${baseSelect}, is_instructor`)
      .is("username", null)
      .is("parent_id", null)
      .in("role", ["parent", "student", "instructor", "admin"])
      .order("created_at", { ascending: false });

    if (input.role && input.role !== "all") {
      request = request.eq("role", input.role);
    }

    const trimmedQuery = input.query?.trim();
    if (trimmedQuery) {
      const pattern = `%${trimmedQuery}%`;
      request = request.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
    }

    const queryResult = await request;
    let data = queryResult.data as ProfileMemberRow[] | null;
    let error = queryResult.error;

    if (error && isMissingInstructorColumnError(error.message)) {
      let fallbackRequest = this.client
        .from("profiles")
        .select(baseSelect)
        .is("username", null)
        .is("parent_id", null)
        .in("role", ["parent", "student", "instructor", "admin"])
        .order("created_at", { ascending: false });

      if (input.role && input.role !== "all") {
        fallbackRequest = fallbackRequest.eq("role", input.role);
      }

      if (trimmedQuery) {
        const pattern = `%${trimmedQuery}%`;
        fallbackRequest = fallbackRequest.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
      }

      const fallback = await fallbackRequest;
      data = (fallback.data ?? null) as ProfileMemberRow[] | null;
      error = fallback.error;
    }

    if (error) {
      throw new Error(`Üye listesi alınamadı: ${error.message}`);
    }

    const rows = (data ?? []) as ProfileMemberRow[];
    const parentIds = rows.filter((row) => row.role === "parent").map((row) => row.id);
    const [childCountByParent, childPhonesByParent] = await Promise.all([
      this.countChildrenByParent(parentIds),
      this.fetchChildPhonesByParent(parentIds),
    ]);

    return rows.map((row) => {
      const childPhones = childPhonesByParent.get(row.id) ?? [];
      const phone =
        row.role === "parent"
          ? resolveContactPhone(row.phone, childPhones)
          : resolveContactPhone(row.phone, [row.parent_phone]);

      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role as AdminMember["role"],
        phone,
        createdAt: row.created_at,
        isActive: row.is_active,
        childCount: childCountByParent.get(row.id) ?? 0,
        isInstructor: profileHasInstructorCapability({
          role: row.role,
          is_instructor: row.is_instructor,
        }),
      };
    });
  }

  private async fetchChildPhonesByParent(parentIds: string[]): Promise<Map<string, string[]>> {
    const phonesByParent = new Map<string, string[]>();
    if (parentIds.length === 0) {
      return phonesByParent;
    }

    const { data, error } = await this.client
      .from("profiles")
      .select("parent_id, parent_phone, phone")
      .in("parent_id", parentIds)
      .eq("role", "student");

    if (error) {
      throw new Error(`Veli telefonları alınamadı: ${error.message}`);
    }

    for (const row of data ?? []) {
      if (!row.parent_id) {
        continue;
      }

      const phones = phonesByParent.get(row.parent_id) ?? [];
      if (row.parent_phone?.trim()) {
        phones.push(row.parent_phone.trim());
      } else if (row.phone?.trim()) {
        phones.push(row.phone.trim());
      }
      phonesByParent.set(row.parent_id, phones);
    }

    return phonesByParent;
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
