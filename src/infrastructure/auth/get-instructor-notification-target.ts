import "server-only";

import type { UserRole } from "@/core/domain/auth";
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export interface InstructorNotificationTarget {
  fullName: string;
  email: string;
  role: UserRole;
}

export async function getInstructorNotificationTarget(
  userId: string,
): Promise<InstructorNotificationTarget> {
  const serviceClient = createServiceRoleClient();

  const { data: profile, error } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role, is_instructor")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  if (!profileHasInstructorCapability(profile)) {
    throw new Error("Bu hesap eğitmen yetkisine sahip değil.");
  }

  let email = profile.email?.trim() ?? "";

  if (!email) {
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
    if (authError) {
      throw new Error(`Auth e-postası okunamadı: ${authError.message}`);
    }
    email = authUser.user?.email?.trim() ?? "";
  }

  if (!email) {
    throw new Error("E-posta adresi bulunamadı.");
  }

  return {
    fullName: profile.full_name,
    email,
    role: profile.role as UserRole,
  };
}
