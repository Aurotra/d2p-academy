function normalizePhoneValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveContactPhone(
  accountPhone: string | null | undefined,
  fallbackPhones: Array<string | null | undefined>,
): string | null {
  const direct = normalizePhoneValue(accountPhone);
  if (direct) {
    return direct;
  }

  for (const phone of fallbackPhones) {
    const normalized = normalizePhoneValue(phone);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}
