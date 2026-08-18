import { describe, expect, it } from "vitest";

import { parentEnrollmentFormsPath } from "@/shared/utils/parent-enrollment-forms-path";

describe("parentEnrollmentFormsPath", () => {
  it("opens the child enrollment forms when both ids exist", () => {
    expect(parentEnrollmentFormsPath("child-1", "enroll-9")).toBe(
      "/dashboard/children/child-1/enrollments/enroll-9/forms",
    );
  });

  it("falls back to children when an id is missing", () => {
    expect(parentEnrollmentFormsPath("", "enroll-9")).toBe("/dashboard/children");
    expect(parentEnrollmentFormsPath("child-1", "")).toBe("/dashboard/children");
  });
});
