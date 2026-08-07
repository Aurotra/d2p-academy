/** Türkiye cep telefonu: 05XXXXXXXXX (11 hane) veya +90 5XX XXX XX XX */
export function normalizeTurkishPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("5") && digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
}

export function isValidTurkishMobilePhone(value: string): boolean {
  return /^05\d{9}$/.test(normalizeTurkishPhone(value));
}

export function formatTurkishPhoneDisplay(value: string): string {
  const normalized = normalizeTurkishPhone(value);
  if (!/^05\d{9}$/.test(normalized)) {
    return value.trim();
  }

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
}

export const TURKISH_MOBILE_PHONE_ERROR =
  "Geçerli bir veli telefon numarası girin (ör. 05XX XXX XX XX veya +90 5XX XXX XX XX).";
