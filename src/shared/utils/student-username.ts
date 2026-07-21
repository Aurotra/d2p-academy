import type { SupabaseClient } from "@supabase/supabase-js";

export class InvalidUsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUsernameError";
  }
}

/** Harf (Türkçe dahil) ile başlar; harf, rakam ve alt çizgi. */
const USERNAME_RE = /^[a-zçğıöşü][a-zçğıöşü0-9_]{2,31}$/u;

/** Eski hesaplar (nokta/tire içeren) için geriye dönük giriş. */
const LEGACY_USERNAME_RE = /^[a-z0-9_.-]{3,20}$/;

function prepareUsernameInput(raw: string): string {
  let value = raw.trim();
  if (value.startsWith("@")) {
    value = value.slice(1);
  }
  return value.replace(/\s+/g, "");
}

export function normalizeUsername(raw: string): string {
  const normalized = prepareUsernameInput(raw).toLocaleLowerCase("tr-TR");

  if (!USERNAME_RE.test(normalized)) {
    throw new InvalidUsernameError(
      "Kullanıcı adı 3-32 karakter olmalı; harf ile başlamalı. Türkçe harf, rakam ve alt çizgi (_) kullanabilirsiniz (ör. emre84, ömer84).",
    );
  }

  return normalized;
}

/** Kayıt ve güncelleme için; geçersizse null. */
export function tryNormalizeUsername(raw: string): string | null {
  try {
    return normalizeUsername(raw);
  } catch {
    return null;
  }
}

/**
 * Giriş / admin araması: yeni kurallar + eski hesaplar (nokta/tire).
 */
export function resolveUsernameForLookup(raw: string): string {
  try {
    return normalizeUsername(raw);
  } catch {
    const legacy = prepareUsernameInput(raw).toLowerCase();
    if (LEGACY_USERNAME_RE.test(legacy)) {
      return legacy;
    }
    throw new InvalidUsernameError(
      "Geçersiz kullanıcı adı. Türkçe harf, rakam ve alt çizgi kullanabilirsiniz.",
    );
  }
}

function lettersOnlyTurkish(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü]/gi, "");
}

/**
 * Ad + soyad + doğum yılının son 2 hanesi (ör. Emre Yılmaz, 2015 → emreyılmaz15).
 */
export function buildStudentUsernameFromIdentity(
  fullName: string,
  birthDate: string,
): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    throw new InvalidUsernameError("Ad ve soyad birlikte girilmelidir.");
  }

  let firstName = lettersOnlyTurkish(parts[0]!);
  let lastName = lettersOnlyTurkish(parts[parts.length - 1]!);

  if (!firstName || !lastName) {
    throw new InvalidUsernameError("Ad ve soyad geçerli harfler içermelidir.");
  }

  const parsed = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidUsernameError("Geçerli bir doğum tarihi girin.");
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    throw new InvalidUsernameError("Doğum tarihi gelecekte olamaz.");
  }

  const yy = String(parsed.getFullYear() % 100).padStart(2, "0");
  const maxNameLen = 30 - yy.length;
  const combinedLen = firstName.length + lastName.length;
  if (combinedLen > maxNameLen) {
    const lastNameBudget = Math.max(2, maxNameLen - firstName.length);
    lastName = lastName.slice(0, lastNameBudget);
    if (firstName.length + lastName.length > maxNameLen) {
      firstName = firstName.slice(0, Math.max(2, maxNameLen - lastName.length));
    }
  }

  return normalizeUsername(`${firstName}${lastName}${yy}`);
}

export function tryBuildStudentUsernameFromIdentity(
  fullName: string,
  birthDate: string,
): string | null {
  try {
    return buildStudentUsernameFromIdentity(fullName, birthDate);
  } catch {
    return null;
  }
}

/** Benzersiz kullanıcı adı üretir; doluysa sonuna rakam ekler (kardeş hesapları için). */
export async function allocateUniqueStudentUsername(
  client: SupabaseClient,
  fullName: string,
  birthDate: string,
): Promise<string> {
  const base = buildStudentUsernameFromIdentity(fullName, birthDate);
  let candidate = base;
  let suffix = 2;

  async function isTaken(username: string): Promise<boolean> {
    const { data } = await client
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .limit(1);

    return Boolean(data && data.length > 0);
  }

  if (!(await isTaken(candidate))) {
    return candidate;
  }

  while (suffix < 100) {
    const suffixText = String(suffix);
    candidate = `${base.slice(0, 32 - suffixText.length)}${suffixText}`;

    if (!(await isTaken(candidate))) {
      return candidate;
    }

    suffix += 1;
  }

  throw new InvalidUsernameError(
    "Bu bilgilerle benzersiz kullanıcı adı oluşturulamadı. Lütfen destek ile iletişime geçin.",
  );
}
