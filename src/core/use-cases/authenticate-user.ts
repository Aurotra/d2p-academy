import type { AuthCredentials, AuthResult, SignUpInput } from "@/core/domain/auth";

export interface AuthRepository {
  signIn(credentials: AuthCredentials): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}

export async function signInWithEmail(
  repository: AuthRepository,
  credentials: AuthCredentials,
): Promise<AuthResult> {
  return repository.signIn(credentials);
}

export async function signUpWithEmail(
  repository: AuthRepository,
  input: SignUpInput,
): Promise<AuthResult> {
  return repository.signUp(input);
}

export async function signOutUser(repository: AuthRepository): Promise<void> {
  return repository.signOut();
}
