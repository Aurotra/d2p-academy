const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

function parseTimeToMinutes(value: string): number {
  const [hourPart, minutePart] = value.split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

/** Günlük ders penceresindeki slot sayısı (ör. 09–17, 60 dk → 8). */
export function computeLessonsPerDay(
  dailyLessonStart: string,
  dailyLessonEnd: string,
  lessonDurationMinutes: number,
): number {
  if (lessonDurationMinutes <= 0) {
    return 0;
  }

  const startMinutes = parseTimeToMinutes(dailyLessonStart);
  const endMinutes = parseTimeToMinutes(dailyLessonEnd);
  if (endMinutes <= startMinutes) {
    return 0;
  }

  return Math.floor((endMinutes - startMinutes) / lessonDurationMinutes);
}

/** Varsayılan toplam yoklama dersi (kurs saati = ders sayısı, örn. 12). */
export const DEFAULT_TOTAL_LESSON_COUNT = 12;

/**
 * Toplam yoklama dersi: adminin girdiği sayı veya varsayılan 12.
 * Etkinlik başlangıç/bitiş tarihleri ile ÇARPILMAZ.
 */
export function resolveTotalLessonCount(
  explicit: number | null | undefined,
  fallback: number = DEFAULT_TOTAL_LESSON_COUNT,
): number {
  if (explicit != null && explicit > 0) {
    return explicit;
  }
  return fallback;
}
