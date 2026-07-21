import "server-only";

import type { AuthResult, SignUpInput } from "@/core/domain/auth";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { SITE_URL } from "@/shared/constants/site";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

function sanitizeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function mapSession(userId: string, email: string) {
  return { userId, email };
}

/**
 * Veli kaydı — service role ile Supabase public signup rate limit'inden kaçınır.
 */
export async function registerParentAccount(input: SignUpInput): Promise<AuthResult> {
  const serviceClient = createServiceRoleClient();
  const email = input.email.trim().toLowerCase();
  const nextPath = sanitizeRedirectPath(input.redirectTo);
  const emailRedirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { data, error } = await serviceClient.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: input.fullName.trim(),
        role: "parent",
      },
    },
  });

  if (error) {
    throw new Error(mapAuthErrorToTurkish(error.message));
  }

  if (!data.user?.email) {
    throw new Error("Kayıt işlemi başarısız oldu.");
  }

  const userId = data.user.id;
  const userEmail = data.user.email;

  // Aynı e-posta ile tekrar kayıt: onay mailini yeniden gönder.
  if (!data.user.identities || data.user.identities.length === 0) {
    const { error: resendError } = await serviceClient.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (resendError) {
      throw new Error(mapAuthErrorToTurkish(resendError.message));
    }

    return {
      session: mapSession(userId, userEmail),
      needsEmailConfirmation: true,
      resentConfirmation: true,
    };
  }

  if (!data.session) {
    return {
      session: mapSession(userId, userEmail),
      needsEmailConfirmation: true,
    };
  }

  return {
    session: mapSession(userId, userEmail),
  };
}
