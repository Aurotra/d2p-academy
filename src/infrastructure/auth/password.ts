import bcrypt from "bcryptjs";

import { InvalidUsernameError, normalizeUsername } from "@/shared/utils/student-username";

export { InvalidUsernameError, normalizeUsername } from "@/shared/utils/student-username";

const SALT_ROUNDS = 12;

export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeakPasswordError";
  }
}

export function assertValidStudentPassword(password: string): void {
  if (typeof password !== "string" || password.length < 6) {
    throw new WeakPasswordError("Şifre en az 6 karakter olmalı.");
  }
  if (password.length > 72) {
    throw new WeakPasswordError("Şifre çok uzun.");
  }
}

export async function hashStudentPassword(plain: string): Promise<string> {
  assertValidStudentPassword(plain);
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyStudentPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) {
    return false;
  }
  return bcrypt.compare(plain, hash);
}
