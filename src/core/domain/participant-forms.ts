export type ConsentFormType = "scientific" | "media" | "participation";

export type SurveyType = "pre_test" | "post_test";

export interface MediaPermissions {
  photo_capture: boolean;
  video_capture: boolean;
  website_publish: boolean;
  social_media_publish: boolean;
  print_materials: boolean;
  academic_anonymous_use: boolean;
  municipal_reports: boolean; // Kurum ve proje raporlarında kullanım
}

export const MEDIA_PERMISSION_KEYS = [
  "photo_capture",
  "video_capture",
  "website_publish",
  "social_media_publish",
  "print_materials",
  "academic_anonymous_use",
  "municipal_reports",
] as const satisfies ReadonlyArray<keyof MediaPermissions>;

export interface ConsentSubmitItem {
  formType: ConsentFormType;
  accepted: boolean;
  consentTextVersion: string;
  parentSignature: string;
  mediaPermissions?: MediaPermissions | null;
}

export interface SubmitConsentsInput {
  consents: ConsentSubmitItem[];
  healthNote?: string | null;
}

export interface IntakeFormInput {
  previousExperience: Record<string, unknown>;
  techAccess: Record<string, unknown>;
  interests: Record<string, unknown>;
  motivation: Record<string, unknown>;
  motivationOther?: string | null;
  intakeLikert: Record<string, number>;
  openEnded: Record<string, string>;
}

export interface SurveyDimensionsInput {
  dimension1: Record<string, number>;
  dimension2: Record<string, number>;
  dimension3: Record<string, number>;
  dimension4: Record<string, number>;
  dimension5: Record<string, number>;
  openEnded?: string | null;
}

export interface PostTestExtraInput {
  trainingImpact: Record<string, unknown>;
  futureTrends: Record<string, unknown>;
  openEnded: Record<string, string>;
}

export interface SubmitPostTestInput extends SurveyDimensionsInput {
  extra: PostTestExtraInput;
}

export interface EnrollmentFormProgress {
  id: string;
  eventId: string;
  eventTitle: string;
  studentCode: string | null;
  intakeFormCompletedAt: string | null;
  preTestCompletedAt: string | null;
  postTestCompletedAt: string | null;
  gradeLevel: string;
  requiresSurveys: boolean;
  profilePrefill: {
    fullName: string;
    gender: string;
    gradeLevel: string;
    schoolName: string;
    cityDistrict: string;
    experienceData: Record<string, unknown>;
    interests: string[];
    motivationData: Record<string, unknown>;
  };
  consents: Array<{
    formType: ConsentFormType;
    accepted: boolean;
    parentSignature: string;
    mediaPermissions: MediaPermissions | null;
    consentTextVersion: string | null;
  }>;
  hasHealthNote: boolean;
  hasIntake: boolean;
  hasPreTest: boolean;
  hasPostTest: boolean;
  hasActiveCertificate: boolean;
  profileProgressPercent: number;
  profileComplete: boolean;
}

export interface SurveyAnswerSnapshot {
  surveyType: SurveyType;
  formVersion: string | null;
  submittedAt: string | null;
  dimensions: {
    dimension1: Record<string, number>;
    dimension2: Record<string, number>;
    dimension3: Record<string, number>;
    dimension4: Record<string, number>;
    dimension5: Record<string, number>;
  };
  openEnded: string | null;
}

export interface EnrollmentFormAnswers {
  enrollmentId: string;
  eventId: string;
  eventTitle: string;
  eventProgramCode: string | null;
  studentName: string;
  studentEmail: string;
  studentCode: string | null;
  gradeLevel: string;
  requiresSurveys: boolean;
  intakeFormCompletedAt: string | null;
  preTestCompletedAt: string | null;
  postTestCompletedAt: string | null;
  healthNote: string | null;
  consents: Array<{
    formType: ConsentFormType;
    accepted: boolean;
    acceptedAt: string | null;
    parentSignature: string | null;
    mediaPermissions: MediaPermissions | null;
    consentTextVersion: string | null;
  }>;
  intake: {
    previousExperience: Record<string, unknown>;
    techAccess: Record<string, unknown>;
    interests: Record<string, unknown>;
    motivation: Record<string, unknown>;
    motivationOther: string | null;
    intakeLikert: Record<string, number>;
    openEnded: Record<string, string>;
    submittedAt: string | null;
  } | null;
  preTest: SurveyAnswerSnapshot | null;
  postTest: SurveyAnswerSnapshot | null;
  postTestExtra: {
    trainingImpact: Record<string, number>;
    futureTrends: Record<string, number>;
    openEnded: Record<string, string>;
  } | null;
}

export function requiresD2pTpsSurveys(gradeLevel: string | null | undefined): boolean {
  const value = (gradeLevel ?? "").trim();
  return value === "5" || value === "6" || value === "7" || value === "8";
}

export function isCompleteMediaPermissions(
  value: unknown,
): value is MediaPermissions {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return MEDIA_PERMISSION_KEYS.every((key) => typeof record[key] === "boolean");
}

/** F06 — tüm kalemlerde “İzin veriyorum” seçilmiş olmalı. */
export function isFullMediaConsentGranted(
  value: MediaPermissions | null | undefined,
): boolean {
  if (!value) {
    return false;
  }

  return MEDIA_PERMISSION_KEYS.every((key) => value[key] === true);
}
