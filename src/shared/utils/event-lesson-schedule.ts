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

function countEventDays(startAt: string | Date, endAt: string | Date): number {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  const end = endAt instanceof Date ? endAt : new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const startDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);

  const endDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(end);

  const startMs = Date.parse(`${startDay}T00:00:00`);
  const endMs = Date.parse(`${endDay}T00:00:00`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 1;
  }

  return Math.max(1, Math.floor((endMs - startMs) / 86_400_000) + 1);
}

/** Günlük ders penceresindeki 1 saatlik (veya lessonDuration) slot sayısı. */
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

/** Etkinlik takviminden otomatik toplam yoklama dersi (ör. 3 gün × 4 saat = 12). */
export function computeTotalLessonsFromSchedule(input: {
  startAt: string | Date;
  endAt: string | Date;
  dailyLessonStart: string;
  dailyLessonEnd: string;
  lessonDurationMinutes: number;
}): number {
  const perDay = computeLessonsPerDay(
    input.dailyLessonStart,
    input.dailyLessonEnd,
    input.lessonDurationMinutes,
  );
  if (perDay <= 0) {
    return 0;
  }

  return perDay * countEventDays(input.startAt, input.endAt);
}
