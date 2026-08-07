import type { AdminParentChildContact, AdminParentRecord } from "@/core/domain/admin-parent";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ParentRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  is_active: boolean;
}

interface ChildRow {
  id: string;
  parent_id: string;
  full_name: string;
  username: string | null;
  parent_phone: string | null;
}

export interface ListAdminParentsInput {
  query?: string;
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function matchesParentQuery(
  parent: ParentRow,
  children: ChildRow[],
  query: string,
): boolean {
  const normalized = normalizeSearchValue(query);
  if (!normalized) {
    return true;
  }

  const digitQuery = digitsOnly(query);
  const parentFields = [parent.full_name, parent.email ?? "", parent.phone ?? ""]
    .join(" ")
    .toLowerCase();

  if (parentFields.includes(normalized)) {
    return true;
  }

  if (digitQuery.length >= 3) {
    const parentDigits = digitsOnly(parent.phone ?? "");
    if (parentDigits.includes(digitQuery)) {
      return true;
    }
  }

  return children.some((child) => {
    const childFields = [child.full_name, child.username ?? "", child.parent_phone ?? ""]
      .join(" ")
      .toLowerCase();
    if (childFields.includes(normalized)) {
      return true;
    }
    if (digitQuery.length >= 3) {
      return digitsOnly(child.parent_phone ?? "").includes(digitQuery);
    }
    return false;
  });
}

function resolveContactPhone(
  accountPhone: string | null,
  children: AdminParentChildContact[],
): string | null {
  if (accountPhone?.trim()) {
    return accountPhone.trim();
  }

  for (const child of children) {
    if (child.parentPhone?.trim()) {
      return child.parentPhone.trim();
    }
  }

  return null;
}

export class SupabaseAdminParentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listParents(input: ListAdminParentsInput = {}): Promise<AdminParentRecord[]> {
    const { data: parentRows, error: parentError } = await this.client
      .from("profiles")
      .select("id, full_name, email, phone, created_at, is_active")
      .eq("role", "parent")
      .is("parent_id", null)
      .is("username", null)
      .order("full_name", { ascending: true });

    if (parentError) {
      throw new Error(`Veli listesi alınamadı: ${parentError.message}`);
    }

    const parents = (parentRows ?? []) as ParentRow[];
    const parentIds = parents.map((parent) => parent.id);

    const childrenByParent = new Map<string, AdminParentChildContact[]>();
    if (parentIds.length > 0) {
      const { data: childRows, error: childError } = await this.client
        .from("profiles")
        .select("id, parent_id, full_name, username, parent_phone")
        .in("parent_id", parentIds)
        .eq("role", "student")
        .not("username", "is", null)
        .order("full_name", { ascending: true });

      if (childError) {
        throw new Error(`Çocuk kayıtları alınamadı: ${childError.message}`);
      }

      for (const row of (childRows ?? []) as ChildRow[]) {
        const list = childrenByParent.get(row.parent_id) ?? [];
        list.push({
          id: row.id,
          fullName: row.full_name,
          username: row.username,
          parentPhone: row.parent_phone,
        });
        childrenByParent.set(row.parent_id, list);
      }
    }

    const records = parents.map((parent) => {
      const children = childrenByParent.get(parent.id) ?? [];
      const profileContactPhone =
        children.find((child) => child.parentPhone?.trim())?.parentPhone?.trim() ?? null;

      return {
        id: parent.id,
        fullName: parent.full_name,
        email: parent.email,
        accountPhone: parent.phone,
        profileContactPhone,
        contactPhone: resolveContactPhone(parent.phone, children),
        childCount: children.length,
        children,
        createdAt: parent.created_at,
        isActive: parent.is_active,
      };
    });

    const query = input.query?.trim();
    if (!query) {
      return records;
    }

    return records.filter((parent) => {
      const childRowsForParent = (childrenByParent.get(parent.id) ?? []).map((child) => ({
        id: child.id,
        parent_id: parent.id,
        full_name: child.fullName,
        username: child.username,
        parent_phone: child.parentPhone,
      }));

      return matchesParentQuery(
        {
          id: parent.id,
          full_name: parent.fullName,
          email: parent.email,
          phone: parent.accountPhone,
          created_at: parent.createdAt,
          is_active: parent.isActive,
        },
        childRowsForParent,
        query,
      );
    });
  }
}
