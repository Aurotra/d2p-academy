export type UserRole = "student" | "instructor" | "admin";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpInput extends AuthCredentials {
  fullName: string;
}

export interface AuthSession {
  userId: string;
  email: string;
}

export interface AuthResult {
  session: AuthSession;
}
