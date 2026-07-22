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

export function requiresD2pTpsSurveys(gradeLevel: string | null | undefined): boolean {
  const value = (gradeLevel ?? "").trim();
  return value === "5" || value === "6" || value === "7" || value === "8";
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
  const requiresSurveys = requiresD2pTpsSurveys(input.gradeLevel);
  const intakeDone = Boolean(input.intakeFormCompletedAt);
  const consentsDone = isConsentsComplete(input.consentRecords);
  const preTestDone = !requiresSurveys || Boolean(input.preTestCompletedAt);
  const postTestDone = !requiresSurveys || Boolean(input.postTestCompletedAt);

  const missing: string[] = [];
  if (!intakeDone) missing.push("Tanışma");
  if (!consentsDone) missing.push("Onaylar");
  if (requiresSurveys && !preTestDone) missing.push("Ön test");
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
