const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

function formatDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Calendar days (Europe/Istanbul) from event start through end, inclusive. */
export function listEventAttendanceDates(startAt: Date, endAt: Date): string[] {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt < startAt) {
    return [];
  }

  const dates: string[] = [];
  let cursor = parseDateKey(formatDateKey(startAt));
  const end = parseDateKey(formatDateKey(endAt));

  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatDateKey(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return dates;
}

export function formatAttendanceDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: ISTANBUL_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
