import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AuthCredentials,
  AuthResult,
  AuthSession,
  SignUpInput,
} from "@/core/domain/auth";
import type { AuthRepository } from "@/core/use-cases/authenticate-user";
import { SITE_URL } from "@/shared/constants/site";

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
      throw new Error(error?.message ?? "Giriş başarısız oldu.");
    }

    return {
      session: mapSession(data.user.id, data.user.email),
    };
  }

  async signUp(input: SignUpInput): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard`,
        data: {
          full_name: input.fullName.trim(),
          role: "student",
        },
      },
    });

    if (error || !data.user?.email) {
      throw new Error(error?.message ?? "Kayıt işlemi başarısız oldu.");
    }

    await this.client.rpc("ensure_user_profile");

    return {
      session: mapSession(data.user.id, data.user.email),
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }
}
