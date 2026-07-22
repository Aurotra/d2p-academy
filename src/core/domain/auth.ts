export type UserRole = "student" | "parent" | "instructor" | "admin";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isInstructor?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpInput extends AuthCredentials {
  fullName: string;
  /** Path to continue after signup / email confirmation (e.g. /dashboard?enroll=...). */
  redirectTo?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
}

export interface AuthResult {
  session: AuthSession;
  role?: UserRole;
  isInstructor?: boolean;
  defaultRedirect?: string;
  /** True when signup succeeded but email confirmation is still required. */
  needsEmailConfirmation?: boolean;
  /** True when confirmation email was resent for an existing unconfirmed account. */
  resentConfirmation?: boolean;
}
