import "server-only";

import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

export interface CreateInstructorAccountInput {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateInstructorAccountResult {
  id: string;
  fullName: string;
  email: string;
}

export async function createInstructorAccount(
  input: CreateInstructorAccountInput,
): Promise<CreateInstructorAccountResult> {
  const serviceClient = createServiceRoleClient();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "instructor",
    },
  });

  if (error) {
    throw new Error(mapAuthErrorToTurkish(error.message));
  }

  if (!data.user) {
    throw new Error("Eğitmen hesabı oluşturulamadı.");
  }

  const { error: profileError } = await serviceClient.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      email,
      role: "instructor",
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Profil kaydı oluşturulamadı: ${profileError.message}`);
  }

  return {
    id: data.user.id,
    fullName,
    email,
  };
}
