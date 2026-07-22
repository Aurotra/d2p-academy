import "server-only";

import type { UserRole } from "@/core/domain/auth";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

const PROMOTABLE_MEMBER_ROLES = new Set<UserRole>(["parent", "student"]);

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const serviceClient = createServiceRoleClient();

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Rol güncellenemedi: ${profileError.message}`);
  }

  const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
  if (authError) {
    throw new Error(`Auth kullanıcısı okunamadı: ${authError.message}`);
  }

  if (authUser.user) {
    const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authUser.user.user_metadata,
        role,
      },
    });

    if (updateAuthError) {
      throw new Error(`Auth rolü güncellenemedi: ${updateAuthError.message}`);
    }
  }
}

export async function promoteMemberToInstructor(userId: string): Promise<{
  fullName: string;
  email: string;
}> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role, username, parent_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Üye bulunamadı.");
  }

  if (profile.username || profile.parent_id) {
    throw new Error("Kullanıcı adlı çocuk hesapları eğitmen yapılamaz.");
  }

  if (!profile.email) {
    throw new Error("E-posta adresi olmayan hesap eğitmen yapılamaz.");
  }

  if (!profile.is_active) {
    throw new Error("Pasif hesap eğitmen yapılamaz.");
  }

  if (!PROMOTABLE_MEMBER_ROLES.has(profile.role as UserRole)) {
    throw new Error("Bu hesap zaten eğitmen veya admin.");
  }

  await setUserRole(userId, "instructor");

  return {
    fullName: profile.full_name,
    email: profile.email,
  };
}

export async function demoteInstructorToMember(userId: string): Promise<{
  fullName: string;
  role: "parent" | "student";
}> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Eğitmen bulunamadı.");
  }

  if (profile.role !== "instructor") {
    throw new Error("Bu hesap eğitmen değil.");
  }

  const { count, error: childError } = await serviceClient
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", userId);

  if (childError) {
    throw new Error(`Çocuk kayıtları kontrol edilemedi: ${childError.message}`);
  }

  const nextRole: "parent" | "student" = (count ?? 0) > 0 ? "parent" : "student";
  await setUserRole(userId, nextRole);

  return {
    fullName: profile.full_name,
    role: nextRole,
  };
}
