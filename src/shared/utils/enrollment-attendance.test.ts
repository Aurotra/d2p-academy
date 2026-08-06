import { describe, expect, it } from "vitest";

import {
  buildEnrollmentAttendanceStatusLabel,
  getEnrollmentAttendancePercent,
  isEnrollmentAttendanceComplete,
} from "@/shared/utils/enrollment-attendance";

describe("enrollment-attendance", () => {
  it("marks attendance complete at required threshold", () => {
    expect(isEnrollmentAttendanceComplete(8, 8)).toBe(true);
    expect(isEnrollmentAttendanceComplete(7, 8)).toBe(false);
  });

  it("calculates attendance percent capped at 100", () => {
    expect(getEnrollmentAttendancePercent(4, 8)).toBe(50);
    expect(getEnrollmentAttendancePercent(10, 8)).toBe(100);
  });

  it("builds remaining lesson label before completion", () => {
    expect(buildEnrollmentAttendanceStatusLabel(3, 8, 12)).toBe(
      "3/8 derse geldi (12 ders programı) · 5 ders kaldı",
    );
  });

  it("builds completion label when threshold met", () => {
    expect(buildEnrollmentAttendanceStatusLabel(8, 8, 12, true)).toBe(
      "8/8 derse geldi · Sertifika için yoklama tamam",
    );
  });
});
