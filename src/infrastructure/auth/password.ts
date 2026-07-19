import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const USERNAME_RE = /^[a-z0-9_.-]{3,20}$/;

export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeakPasswordError";
  }
}

export class InvalidUsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUsernameError";
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

export function normalizeUsername(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(normalized)) {
    throw new InvalidUsernameError(
      "Kullanıcı adı 3-20 karakter olmalı; sadece harf, rakam, '.', '_' , '-' içerebilir.",
    );
  }
  return normalized;
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
