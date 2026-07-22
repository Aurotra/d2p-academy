import "server-only";

import type { UserRole } from "@/core/domain/auth";
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

const PROMOTABLE_MEMBER_ROLES = new Set<UserRole>(["parent", "student", "admin"]);

async function setInstructorCapability(userId: string, enabled: boolean): Promise<void> {
  const serviceClient = createServiceRoleClient();

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({
      is_instructor: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Eğitmen yetkisi güncellenemedi: ${profileError.message}`);
  }

  const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
  if (authError) {
    throw new Error(`Auth kullanıcısı okunamadı: ${authError.message}`);
  }

  if (authUser.user) {
    const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authUser.user.user_metadata,
        is_instructor: enabled,
      },
    });

    if (updateAuthError) {
      throw new Error(`Auth eğitmen bayrağı güncellenemedi: ${updateAuthError.message}`);
    }
  }
}

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
  role: UserRole;
}> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role, username, parent_id, is_active, is_instructor")
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

  if (profileHasInstructorCapability(profile)) {
    throw new Error("Bu hesap zaten eğitmen yetkisine sahip.");
  }

  if (!PROMOTABLE_MEMBER_ROLES.has(profile.role as UserRole)) {
    throw new Error("Bu hesap eğitmen yapılamaz.");
  }

  await setInstructorCapability(userId, true);

  return {
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
  };
}

export async function demoteInstructorToMember(userId: string): Promise<{
  fullName: string;
  email: string | null;
  role: UserRole;
  unassignedEventCount: number;
}> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role, is_instructor")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Eğitmen bulunamadı.");
  }

  if (!profileHasInstructorCapability(profile)) {
    throw new Error("Bu hesap eğitmen değil.");
  }

  const { count: assignedEventCount, error: eventCountError } = await serviceClient
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", userId);

  if (eventCountError) {
    throw new Error(`Etkinlik atamaları kontrol edilemedi: ${eventCountError.message}`);
  }

  if ((assignedEventCount ?? 0) > 0) {
    const { error: unassignError } = await serviceClient
      .from("events")
      .update({ instructor_id: null })
      .eq("instructor_id", userId);

    if (unassignError) {
      throw new Error(`Etkinlik atamaları kaldırılamadı: ${unassignError.message}`);
    }
  }

  await setInstructorCapability(userId, false);

  let resolvedRole = profile.role as UserRole;

  if (profile.role === "instructor") {
    const { count, error: childError } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", userId);

    if (childError) {
      throw new Error(`Çocuk kayıtları kontrol edilemedi: ${childError.message}`);
    }

    resolvedRole = (count ?? 0) > 0 ? "parent" : "student";
    await setUserRole(userId, resolvedRole);
  }

  return {
    fullName: profile.full_name,
    email: profile.email,
    role: resolvedRole,
    unassignedEventCount: assignedEventCount ?? 0,
  };
}
