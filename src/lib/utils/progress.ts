import type { ProfileProgressInput } from "@/core/domain/student-profile";

const TOTAL_PROFILE_FIELDS = 9;

export const PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE =
  "Öncelikle profilinizdeki kendini tanıtma adımını %100 tamamlayın. Tamamlanan proje sayısı isteğe bağlıdır.";

function isFilledText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function calculateProgress(data: ProfileProgressInput): number {
  const filledCount = [
    isFilledText(data.full_name),
    isFilledText(data.gender),
    isFilledText(data.grade_level),
    isFilledText(data.school_name),
    isFilledText(data.city_district),
    isFilledText(data.experience_data?.coding_experience),
    Boolean(data.interests && data.interests.length > 0),
    isFilledText(data.motivation_data?.hedef) &&
      typeof data.motivation_data?.beklenti === "number" &&
      data.motivation_data.beklenti >= 1 &&
      data.motivation_data.beklenti <= 5,
    isFilledText(data.profile_avatar_url),
  ].filter(Boolean).length;

  return Math.round((filledCount / TOTAL_PROFILE_FIELDS) * 100);
}

export function isProfileComplete(data: ProfileProgressInput): boolean {
  return calculateProgress(data) === 100;
}

export function profileCertificateBlockMessage(progressPercent: number): string {
  return `${PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE} Şu an profiliniz %${progressPercent} dolu.`;
}
