/** Kaklık 3D Yaz Kursu — homepage campaign (toggle when event is live). */
export const KAKLIK_CAMPAIGN_ENABLED = true;

export const KAKLIK_CAMPAIGN_ID = "kaklik-3d-yaz-kursu" as const;

export const KAKLIK_CAMPAIGN_TITLE = "Kaklık 3D Yaz Kursu";

export const KAKLIK_CAMPAIGN_BANNER_TEXT =
  "Büyük Etkinlik 20 Temmuz Pazartesi Başlıyor! Yarına kadar kaydolun ve yerinizi ayırtın.";

export const KAKLIK_CAMPAIGN_NOTE =
  "Önemli Not: Eğitimlerimiz 20 Temmuz Pazartesi günü başlayacaktır. Seçtiğiniz gruptaki eğitiminiz Salı ve Perşembe günleri de aynı saatlerde devam edecektir.";

export const KAKLIK_TIME_GROUPS = [
  {
    value: "group_1",
    label: "1. Grup: 10:00 - 11:30",
    shortLabel: "1. Grup",
    hours: "10:00 - 11:30",
  },
  {
    value: "group_2",
    label: "2. Grup: 12:00 - 13:30",
    shortLabel: "2. Grup",
    hours: "12:00 - 13:30",
  },
  {
    value: "group_3",
    label: "3. Grup: 14:00 - 15:30",
    shortLabel: "3. Grup",
    hours: "14:00 - 15:30",
  },
] as const;

export type KaklikTimeGroupValue = (typeof KAKLIK_TIME_GROUPS)[number]["value"];

export function formatKaklikTimeGroup(value: string | null | undefined): string {
  const match = KAKLIK_TIME_GROUPS.find((group) => group.value === value);
  return match?.label ?? value ?? "—";
}
