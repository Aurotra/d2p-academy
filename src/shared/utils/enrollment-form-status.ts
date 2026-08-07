import type { ConsentFormType, MediaPermissions } from "@/core/domain/participant-forms";
import {
  isFullMediaConsentGranted,
  requiresD2pTpsSurveys,
  requiresPreTest,
} from "@/core/domain/participant-forms";

export interface ConsentRecordSnapshot {
  form_type: string;
  accepted: boolean;
  media_permissions: MediaPermissions | null;
}

export interface EnrollmentFormStatus {
  intakeDone: boolean;
  consentsDone: boolean;
  preTestDone: boolean;
  postTestDone: boolean;
  requiresPreTest: boolean;
  requiresSurveys: boolean;
  allRequiredDone: boolean;
}

function isConsentsComplete(records: ConsentRecordSnapshot[]): boolean {
  const byType = new Map(records.map((row) => [row.form_type, row]));

  for (const type of ["scientific", "media", "participation"] as ConsentFormType[]) {
    const record = byType.get(type);
    if (!record?.accepted) {
      return false;
    }
  }

  const media = byType.get("media");
  if (!media || !isFullMediaConsentGranted(media.media_permissions)) {
    return false;
  }

  return true;
}

export function getEnrollmentFormStatus(input: {
  gradeLevel: string | null | undefined;
  intakeFormCompletedAt: string | null;
  preTestCompletedAt: string | null;
  postTestCompletedAt: string | null;
  consentRecords: ConsentRecordSnapshot[];
}): EnrollmentFormStatus {
  const requiresPreTestFlag = requiresPreTest(input.gradeLevel);
  const requiresSurveys = requiresD2pTpsSurveys(input.gradeLevel);
  const intakeDone = Boolean(input.intakeFormCompletedAt);
  const consentsDone = isConsentsComplete(input.consentRecords);
  const preTestDone = !requiresPreTestFlag || Boolean(input.preTestCompletedAt);
  const postTestDone = !requiresSurveys || Boolean(input.postTestCompletedAt);
  const allRequiredDone = intakeDone && consentsDone && preTestDone && postTestDone;

  return {
    intakeDone,
    consentsDone,
    preTestDone,
    postTestDone,
    requiresPreTest: requiresPreTestFlag,
    requiresSurveys,
    allRequiredDone,
  };
}

export function buildEnrollmentFormStatusLabel(input: {
  intakeCompleted?: boolean;
  consentsCompleted?: boolean;
  preTestCompleted?: boolean;
  postTestCompleted?: boolean;
  postTestUnlocked?: boolean;
  requiresPreTest?: boolean;
  requiresSurveys?: boolean;
}): string {
  const requiresPreTestFlag = input.requiresPreTest !== false;
  const requiresSurveys = input.requiresSurveys !== false;
  const steps = getEnrollmentFormSteps(input, requiresPreTestFlag, requiresSurveys);

  const missing = steps.filter((step) => !step.done).map((step) => step.label);
  if (missing.length === 0) {
    if (requiresSurveys && !input.postTestCompleted && !input.postTestUnlocked) {
      return "Kayıt tamam — etkinlik sonrası son test";
    }
    return "Formlar tamam";
  }
  if (missing.length === steps.length) {
    return "Formlar eksik";
  }
  return `Eksik: ${missing.join(", ")}`;
}

function getEnrollmentFormSteps(
  input: {
    intakeCompleted?: boolean;
    consentsCompleted?: boolean;
    preTestCompleted?: boolean;
    postTestCompleted?: boolean;
    postTestUnlocked?: boolean;
  },
  requiresPreTestFlag: boolean,
  requiresSurveys: boolean,
) {
  const postTestUnlocked = Boolean(input.postTestUnlocked);

  return [
    { label: "Tanışma", done: Boolean(input.intakeCompleted), required: true },
    { label: "Onaylar", done: Boolean(input.consentsCompleted), required: true },
    { label: "Ön test", done: Boolean(input.preTestCompleted), required: requiresPreTestFlag },
    {
      label: "Son test",
      done: Boolean(input.postTestCompleted),
      required: requiresSurveys && postTestUnlocked,
    },
  ].filter((step) => step.required);
}

export function getEnrollmentFormCompletionPercent(input: {
  intakeCompleted?: boolean;
  consentsCompleted?: boolean;
  preTestCompleted?: boolean;
  postTestCompleted?: boolean;
  postTestUnlocked?: boolean;
  requiresPreTest?: boolean;
  requiresSurveys?: boolean;
}): number {
  const requiresPreTestFlag = input.requiresPreTest !== false;
  const requiresSurveys = input.requiresSurveys !== false;
  const steps = getEnrollmentFormSteps(input, requiresPreTestFlag, requiresSurveys);
  if (steps.length === 0) {
    return 100;
  }

  const completed = steps.filter((step) => step.done).length;
  return Math.round((completed / steps.length) * 100);
}
