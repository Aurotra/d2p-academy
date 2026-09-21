const PROGRAM_CODE_RE = /^[A-Z0-9]{2,4}$/;

export function normalizeProgramCode(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  if (!value) {
    return null;
  }
  if (!PROGRAM_CODE_RE.test(value)) {
    throw new Error("Program kodu 2–4 karakter olmalıdır (A–Z, 0–9; ör. KYK, DC, 3DTY).");
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
