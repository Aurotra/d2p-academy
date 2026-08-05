const LEGACY_TIME_GROUP_LABELS: Record<string, string> = {
  group_1: "1. Grup: 10:00 - 11:30",
  group_2: "2. Grup: 12:00 - 13:30",
  group_3: "3. Grup: 14:00 - 15:30",
};

export function formatLegacyTimeGroup(value: string | null | undefined): string {
  if (!value) return "—";
  return LEGACY_TIME_GROUP_LABELS[value] ?? value;
}

export function formatLegacyCampaign(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.replace(/-/g, " ");
}
