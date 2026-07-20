export class InvalidUsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUsernameError";
  }
}

/** Harf ile başlar; harf, rakam ve alt çizgi. Türkçe karakterler ASCII'ye çevrilir. */
const USERNAME_RE = /^[a-z][a-z0-9_]{2,31}$/;

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  I: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

function transliterateTurkish(value: string): string {
  return value.replace(/[çğıöşüÇĞİÖŞÜI]/g, (char) => TURKISH_CHAR_MAP[char] ?? char);
}

export function normalizeUsername(raw: string): string {
  let normalized = transliterateTurkish(raw.trim().toLowerCase());

  if (normalized.startsWith("@")) {
    normalized = normalized.slice(1);
  }

  normalized = normalized.replace(/\s+/g, "");

  if (!USERNAME_RE.test(normalized)) {
    throw new InvalidUsernameError(
      "Kullanıcı adı 3-32 karakter olmalı; harf ile başlamalı. Harf, rakam ve alt çizgi (_) kullanabilirsiniz (ör. emre84).",
    );
  }

  return normalized;
}

export function tryNormalizeUsername(raw: string): string | null {
  try {
    return normalizeUsername(raw);
  } catch {
    return null;
  }
}
