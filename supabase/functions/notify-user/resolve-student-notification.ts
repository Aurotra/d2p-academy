import type { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export interface StudentProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  parent_id: string | null;
}

export interface ParentProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function isUsernameStudent(student: { parent_id: string | null }): boolean {
  return Boolean(student.parent_id);
}

export function studentDocumentsPath(student: { parent_id: string | null }): string {
  return isUsernameStudent(student) ? "/student-dashboard/documents" : "/dashboard/documents";
}

export function studentReportPath(student: { parent_id: string | null }): string {
  return isUsernameStudent(student) ? "/student-dashboard/report" : "/dashboard/report";
}

export async function resolveStudentRecipientEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  student: StudentProfileRow,
  parentById: Map<string, ParentProfileRow>,
): Promise<{ email: string; recipientName: string; notifyParent: boolean } | null> {
  if (student.parent_id) {
    const parent = parentById.get(student.parent_id);
    if (parent?.email) {
      return {
        email: parent.email,
        recipientName: parent.full_name ?? "Veli",
        notifyParent: true,
      };
    }

    const { data: authParent } = await supabaseAdmin.auth.admin.getUserById(student.parent_id);
    if (authParent.user?.email) {
      return {
        email: authParent.user.email,
        recipientName: parent?.full_name ?? "Veli",
        notifyParent: true,
      };
    }

    return null;
  }

  if (student.email) {
    return {
      email: student.email,
      recipientName: student.full_name ?? "Öğrenci",
      notifyParent: false,
    };
  }

  const { data: authStudent } = await supabaseAdmin.auth.admin.getUserById(student.id);
  if (authStudent.user?.email) {
    return {
      email: authStudent.user.email,
      recipientName: student.full_name ?? "Öğrenci",
      notifyParent: false,
    };
  }

  return null;
}

export async function loadParentProfiles(
  supabaseAdmin: ReturnType<typeof createClient>,
  parentIds: string[],
): Promise<Map<string, ParentProfileRow>> {
  const parentById = new Map<string, ParentProfileRow>();
  const uniqueParentIds = [...new Set(parentIds.filter(Boolean))];

  if (uniqueParentIds.length === 0) {
    return parentById;
  }

  const { data: parents, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", uniqueParentIds);

  if (error) {
    throw new Error(`Veli profilleri alınamadı: ${error.message}`);
  }

  for (const parent of parents ?? []) {
    parentById.set(parent.id, parent);
  }

  return parentById;
}
