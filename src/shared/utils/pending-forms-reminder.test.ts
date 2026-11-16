import { describe, expect, it } from "vitest";

import {
  buildPendingFormsReminders,
  isEnrollmentMissingRequiredForms,
} from "@/shared/utils/pending-forms-reminder";

describe("pending forms reminder", () => {
  it("flags missing intake or consents", () => {
    expect(
      isEnrollmentMissingRequiredForms({
        status: "registered",
        intakeCompleted: false,
        consentsCompleted: true,
        preTestCompleted: true,
        requiresPreTest: true,
      }),
    ).toBe(true);

    expect(
      isEnrollmentMissingRequiredForms({
        status: "registered",
        intakeCompleted: true,
        consentsCompleted: false,
        preTestCompleted: true,
        requiresPreTest: true,
      }),
    ).toBe(true);
  });

  it("skips pending payment and completed forms", () => {
    expect(
      isEnrollmentMissingRequiredForms({
        status: "pending_payment",
        intakeCompleted: false,
        consentsCompleted: false,
      }),
    ).toBe(false);

    expect(
      isEnrollmentMissingRequiredForms({
        status: "registered",
        intakeCompleted: true,
        consentsCompleted: true,
        preTestCompleted: true,
        requiresPreTest: true,
      }),
    ).toBe(false);
  });

  it("builds form links for incomplete enrollments", () => {
    const reminders = buildPendingFormsReminders([
      {
        childId: "c1",
        childName: "Kayra",
        enrollmentId: "e1",
        eventTitle: "3D Yazıcı",
        status: "registered",
        intakeCompleted: false,
        consentsCompleted: false,
      },
    ]);

    expect(reminders).toEqual([
      {
        childId: "c1",
        childName: "Kayra",
        enrollmentId: "e1",
        eventTitle: "3D Yazıcı",
        formsHref: "/dashboard/children/c1/enrollments/e1/forms",
      },
    ]);
  });
});
