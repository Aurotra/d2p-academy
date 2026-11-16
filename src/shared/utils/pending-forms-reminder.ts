import { parentEnrollmentFormsPath } from "@/shared/utils/parent-enrollment-forms-path";

export interface PendingFormsReminderItem {
  childId: string;
  childName: string;
  enrollmentId: string;
  eventTitle: string;
  formsHref: string;
}

export function isEnrollmentMissingRequiredForms(input: {
  status: string;
  intakeCompleted?: boolean;
  consentsCompleted?: boolean;
  preTestCompleted?: boolean;
  requiresPreTest?: boolean;
}): boolean {
  if (input.status === "cancelled" || input.status === "pending_payment") {
    return false;
  }

  if (!input.intakeCompleted || !input.consentsCompleted) {
    return true;
  }

  if (input.requiresPreTest !== false && !input.preTestCompleted) {
    return true;
  }

  return false;
}

export function buildPendingFormsReminders(
  enrollments: Array<{
    childId: string;
    childName: string;
    enrollmentId: string;
    eventTitle: string;
    status: string;
    intakeCompleted?: boolean;
    consentsCompleted?: boolean;
    preTestCompleted?: boolean;
    requiresPreTest?: boolean;
  }>,
): PendingFormsReminderItem[] {
  return enrollments
    .filter((item) => isEnrollmentMissingRequiredForms(item))
    .map((item) => ({
      childId: item.childId,
      childName: item.childName,
      enrollmentId: item.enrollmentId,
      eventTitle: item.eventTitle,
      formsHref: parentEnrollmentFormsPath(item.childId, item.enrollmentId),
    }));
}
