import "server-only";

import type { AuthResult, SignUpInput } from "@/core/domain/auth";
import { sendSignupConfirmationNotification } from "@/infrastructure/email/send-signup-confirmation-notification";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { SITE_URL } from "@/shared/constants/site";
import { buildEmailConfirmationUrl, sanitizeParentAuthNextPath } from "@/shared/utils/auth-redirect";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

function mapSession(userId: string, email: string) {
  return { userId, email };
}

async function deliverSignupConfirmationEmail(input: {
  serviceClient: ReturnType<typeof createServiceRoleClient>;
  email: string;
  fullName: string;
  emailRedirectTo: string;
  confirmationLink?: string;
  nextPath: string;
  password: string;
}): Promise<void> {
  let confirmationLink = input.confirmationLink;

  if (!confirmationLink) {
    const { data: linkData, error: linkError } = await input.serviceClient.auth.admin.generateLink({
      type: "signup",
      email: input.email,
      password: input.password,
      options: {
        redirectTo: input.emailRedirectTo,
        data: {
          full_name: input.fullName,
          role: "parent",
        },
      },
    });

    if (linkError) {
      throw new Error(mapAuthErrorToTurkish(linkError.message));
    }

    const hashedToken = linkData?.properties?.hashed_token;
    if (!hashedToken) {
      throw new Error("Onay bağlantısı oluşturulamadı.");
    }

    confirmationLink = buildEmailConfirmationUrl({
      tokenHash: hashedToken,
      type: "signup",
      nextPath: input.nextPath,
    });
  }

  const emailResult = await sendSignupConfirmationNotification({
    recipientName: input.fullName,
    email: input.email,
    actionLink: confirmationLink,
  });

  if (emailResult.emailSent) {
    return;
  }

  const { error: resendError } = await input.serviceClient.auth.resend({
    type: "signup",
    email: input.email,
    options: { emailRedirectTo: input.emailRedirectTo },
  });

  if (resendError) {
    throw new Error(
      emailResult.emailError ??
        mapAuthErrorToTurkish(resendError.message) ??
        "Onay e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin veya info@d2p.com.tr adresine yazın.",
    );
  }
}

/**
 * Veli kaydı — service role ile Supabase public signup rate limit'inden kaçınır.
 * Onay e-postası Resend üzerinden gönderilir (Supabase varsayılan SMTP'ye güvenilmez).
 */
export async function registerParentAccount(input: SignUpInput): Promise<AuthResult> {
  const serviceClient = createServiceRoleClient();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const nextPath = sanitizeParentAuthNextPath(input.redirectTo);
  const emailRedirectTo = `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      redirectTo: emailRedirectTo,
      data: {
        full_name: fullName,
        role: "parent",
      },
    },
  });

  if (error) {
    throw new Error(mapAuthErrorToTurkish(error.message));
  }

  const user = data.user;
  const hashedToken = data.properties?.hashed_token;

  if (!user?.email) {
    throw new Error("Kayıt işlemi başarısız oldu.");
  }

  const userId = user.id;
  const userEmail = user.email;
  const createdAtMs = new Date(user.created_at).getTime();
  const resentConfirmation = Date.now() - createdAtMs > 60_000;
  const confirmationLink = hashedToken
    ? buildEmailConfirmationUrl({
        tokenHash: hashedToken,
        type: "signup",
        nextPath,
      })
    : undefined;

  await deliverSignupConfirmationEmail({
    serviceClient,
    email,
    fullName,
    emailRedirectTo,
    confirmationLink,
    nextPath,
    password: input.password,
  });

  return {
    session: mapSession(userId, userEmail),
    needsEmailConfirmation: true,
    resentConfirmation,
  };
}
