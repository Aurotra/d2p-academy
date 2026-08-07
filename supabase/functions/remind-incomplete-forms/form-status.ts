const MEDIA_PERMISSION_KEYS = [
  "photo_capture",
  "video_capture",
  "website_publish",
  "social_media_publish",
  "print_materials",
  "academic_anonymous_use",
  "municipal_reports",
] as const;

export interface ConsentRecordSnapshot {
  form_type: string;
  accepted: boolean;
  media_permissions: Record<string, boolean> | null;
}

const PRE_TEST_GRADE_LEVELS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "university",
  "other",
] as const;

export function requiresPreTest(gradeLevel: string | null | undefined): boolean {
  const value = (gradeLevel ?? "").trim();
  return (PRE_TEST_GRADE_LEVELS as readonly string[]).includes(value);
}

export function requiresD2pTpsSurveys(gradeLevel: string | null | undefined): boolean {
  const value = (gradeLevel ?? "").trim();
  return ["2", "3", "4", "5", "6", "7", "8"].includes(value);
}

function isFullMediaConsentGranted(value: Record<string, boolean> | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return MEDIA_PERMISSION_KEYS.every((key) => value[key] === true);
}

function isConsentsComplete(records: ConsentRecordSnapshot[]): boolean {
  const byType = new Map(records.map((row) => [row.form_type, row]));

  for (const type of ["scientific", "media", "participation"]) {
    const record = byType.get(type);
    if (!record?.accepted) {
      return false;
    }
  }

  const media = byType.get("media");
  return Boolean(media && isFullMediaConsentGranted(media.media_permissions));
}

export function getMissingFormLabels(input: {
  gradeLevel: string | null | undefined;
  intakeFormCompletedAt: string | null;
  preTestCompletedAt: string | null;
  postTestCompletedAt: string | null;
  consentRecords: ConsentRecordSnapshot[];
}): string[] {
  const requiresPreTestFlag = requiresPreTest(input.gradeLevel);
  const requiresSurveys = requiresD2pTpsSurveys(input.gradeLevel);
  const intakeDone = Boolean(input.intakeFormCompletedAt);
  const consentsDone = isConsentsComplete(input.consentRecords);
  const preTestDone = !requiresPreTestFlag || Boolean(input.preTestCompletedAt);
  const postTestDone = !requiresSurveys || Boolean(input.postTestCompletedAt);

  const missing: string[] = [];
  if (!intakeDone) missing.push("Tanışma");
  if (!consentsDone) missing.push("Onaylar");
  if (requiresPreTestFlag && !preTestDone) missing.push("Ön test");
  if (requiresSurveys && !postTestDone) missing.push("Son test");
  return missing;
}

export function isEnrollmentFormsComplete(input: {
  gradeLevel: string | null | undefined;
  intakeFormCompletedAt: string | null;
  preTestCompletedAt: string | null;
  postTestCompletedAt: string | null;
  consentRecords: ConsentRecordSnapshot[];
}): boolean {
  return getMissingFormLabels(input).length === 0;
}
