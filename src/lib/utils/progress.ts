import type { ProfileProgressInput } from "@/core/domain/student-profile";

const TOTAL_PROFILE_FIELDS = 9;

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
