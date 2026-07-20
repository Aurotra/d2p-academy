const PROGRAM_CODE_RE = /^[A-Z]{2,4}$/;

export function normalizeProgramCode(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  if (!value) {
    return null;
  }
  if (!PROGRAM_CODE_RE.test(value)) {
    throw new Error("Program kodu 2–4 harf olmalıdır (ör. KYK, DC).");
  }
  return value;
}

export function tryNormalizeProgramCode(raw: string): string | null {
  try {
    return normalizeProgramCode(raw);
  } catch {
    return null;
  }
}
