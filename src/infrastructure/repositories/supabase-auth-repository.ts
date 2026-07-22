import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AuthCredentials,
  AuthResult,
  AuthSession,
  SignUpInput,
} from "@/core/domain/auth";
import type { AuthRepository } from "@/core/use-cases/authenticate-user";
import { SITE_URL } from "@/shared/constants/site";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

function sanitizeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function mapSession(userId: string, email: string): AuthSession {
  return {
    userId,
    email,
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    if (error || !data.user?.email) {
      throw new Error(mapAuthErrorToTurkish(error?.message ?? "Giriş başarısız oldu."));
    }

    const { data: profile } = await this.client
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const role = profile?.role;
    const defaultRedirect =
      role === "admin" ? "/admin" : role === "instructor" ? "/instructor" : "/dashboard";

    return {
      session: mapSession(data.user.id, data.user.email),
      role:
        role === "admin" || role === "instructor" || role === "student" ? role : undefined,
      defaultRedirect,
    };
  }

  async signUp(input: SignUpInput): Promise<AuthResult> {
    const nextPath = sanitizeRedirectPath(input.redirectTo);
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        data: {
          full_name: input.fullName.trim(),
          role: "student",
        },
      },
    });

    if (error) {
      throw new Error(mapAuthErrorToTurkish(error.message));
    }

    if (!data.user?.email) {
      throw new Error("Kayıt işlemi başarısız oldu.");
    }

    // Supabase: aynı e-posta ile tekrar kayıtta boş identities dönebilir
    if (!data.user.identities || data.user.identities.length === 0) {
      throw new Error(
        mapAuthErrorToTurkish(
          "User already registered. Please check your email for the confirmation link.",
        ),
      );
    }

    // E-posta onayı açıkken session null gelir — panele yönlendirme
    if (!data.session) {
      return {
        session: mapSession(data.user.id, data.user.email),
        needsEmailConfirmation: true,
      };
    }

    await this.client.rpc("ensure_user_profile");

    return {
      session: mapSession(data.user.id, data.user.email),
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw new Error(mapAuthErrorToTurkish(error.message));
    }
  }
}
