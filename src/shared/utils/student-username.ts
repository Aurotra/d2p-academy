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
