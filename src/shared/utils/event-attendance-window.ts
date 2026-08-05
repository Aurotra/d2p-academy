const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

function formatIstanbulDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Etkinlik takvim günleri içindeyken yoklama işaretlenebilir. */
export function isEventAttendanceOpen(startAt: string, endAt: string): boolean {
  const today = formatIstanbulDateKey(new Date());
  const startDay = formatIstanbulDateKey(new Date(startAt));
  const endDay = formatIstanbulDateKey(new Date(endAt));
  return today >= startDay && today <= endDay;
}

export function formatEventAttendanceWindowLabel(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    timeZone: ISTANBUL_TIME_ZONE,
    dateStyle: "long",
  });
  return `${formatter.format(new Date(startAt))} – ${formatter.format(new Date(endAt))}`;
}
