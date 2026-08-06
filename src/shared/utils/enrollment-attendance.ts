export const DEFAULT_REQUIRED_LESSON_COUNT = 8;
export const DEFAULT_TOTAL_LESSON_COUNT = 12;

export function resolveRequiredLessonCount(value: number | null | undefined): number {
  return value ?? DEFAULT_REQUIRED_LESSON_COUNT;
}

export function isEnrollmentAttendanceComplete(
  presentCount: number,
  requiredLessonCount: number | null | undefined,
): boolean {
  return presentCount >= resolveRequiredLessonCount(requiredLessonCount);
}

export function formatAttendanceCertificateLabel(
  presentCount: number,
  requiredLessonCount: number | null | undefined,
  totalLessonCount: number,
): string {
  const required = resolveRequiredLessonCount(requiredLessonCount);
  return `${presentCount}/${required} · ${totalLessonCount} ders`;
}

export function getEnrollmentAttendancePercent(
  presentCount: number,
  requiredLessonCount: number | null | undefined,
): number {
  const required = resolveRequiredLessonCount(requiredLessonCount);
  if (required <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((presentCount / required) * 100));
}

export function buildEnrollmentAttendanceStatusLabel(
  presentCount: number,
  requiredLessonCount: number | null | undefined,
  totalLessonCount: number,
  attendanceComplete?: boolean,
): string {
  const required = resolveRequiredLessonCount(requiredLessonCount);
  const complete = attendanceComplete ?? presentCount >= required;

  if (complete) {
    return `${presentCount}/${required} derse geldi · Sertifika için yoklama tamam`;
  }

  const remaining = Math.max(required - presentCount, 0);
  return `${presentCount}/${required} derse geldi (${totalLessonCount} ders programı) · ${remaining} ders kaldı`;
}
