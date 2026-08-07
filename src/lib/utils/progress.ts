import type { ProfileProgressInput } from "@/core/domain/student-profile";
import { isValidTurkishMobilePhone } from "@/shared/utils/turkish-phone";

const BASE_PROFILE_FIELD_COUNT = 9;

export interface ProfileProgressOptions {
  requireParentPhone?: boolean;
}

export function profileProgressOptions(profile: {
  parent_id?: string | null;
}): ProfileProgressOptions {
  return { requireParentPhone: Boolean(profile.parent_id) };
}

export const PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE =
  "Öncelikle profilinizdeki kendini tanıtma adımını %100 tamamlayın. Tamamlanan proje sayısı isteğe bağlıdır.";

export const PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE =
  "Kurslara kayıt olabilmek ve sertifika alabilmek için çocuğunuzun profil bilgilerini %100 tamamlamanız gerekir. Lütfen eksik alanları doldurun.";

function isFilledText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isMotivationComplete(
  motivation: ProfileProgressInput["motivation_data"],
): boolean {
  return (
    isFilledText(motivation?.hedef) &&
    typeof motivation?.beklenti === "number" &&
    motivation.beklenti >= 1 &&
    motivation.beklenti <= 5
  );
}

function getProfileFieldChecks(
  data: ProfileProgressInput,
  options?: ProfileProgressOptions,
): boolean[] {
  const checks = [
    isFilledText(data.full_name),
    isFilledText(data.gender),
    isFilledText(data.grade_level),
    isFilledText(data.school_name),
    isFilledText(data.city_district),
    isFilledText(data.experience_data?.coding_experience),
    Boolean(data.interests && data.interests.length > 0),
    isMotivationComplete(data.motivation_data),
    isFilledText(data.profile_avatar_url),
  ];

  if (options?.requireParentPhone) {
    checks.push(isValidTurkishMobilePhone(data.parent_phone ?? ""));
  }

  return checks;
}

export function getTotalProfileFields(options?: ProfileProgressOptions): number {
  return BASE_PROFILE_FIELD_COUNT + (options?.requireParentPhone ? 1 : 0);
}

export function countFilledProfileFields(
  data: ProfileProgressInput,
  options?: ProfileProgressOptions,
): number {
  return getProfileFieldChecks(data, options).filter(Boolean).length;
}

export function calculateProgress(
  data: ProfileProgressInput,
  options?: ProfileProgressOptions,
): number {
  const total = getTotalProfileFields(options);
  const filledCount = countFilledProfileFields(data, options);
  return Math.round((filledCount / total) * 100);
}

export function isProfileComplete(
  data: ProfileProgressInput,
  options?: ProfileProgressOptions,
): boolean {
  return calculateProgress(data, options) === 100;
}

export function profileCertificateBlockMessage(progressPercent: number): string {
  return `${PROFILE_REQUIRED_FOR_CERTIFICATE_MESSAGE} Şu an profiliniz %${progressPercent} dolu.`;
}
