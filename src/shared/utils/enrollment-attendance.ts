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
