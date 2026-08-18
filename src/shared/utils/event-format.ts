const TURKEY_TIME_ZONE = "Europe/Istanbul";

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function formatEventDateLong(date: Date): string {
  if (!isValidDate(date)) {
    return "Tarih belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);
}

export function formatEventDateParts(date: Date): { day: string; month: string } {
  return {
    day: new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      timeZone: TURKEY_TIME_ZONE,
    }).format(date),
    month: new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      timeZone: TURKEY_TIME_ZONE,
    }).format(date),
  };
}

export function formatEventTime(date: Date): string {
  if (!isValidDate(date)) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);
}

export function formatEventTimeRange(startAt: Date, endAt: Date): string {
  return `${formatEventTime(startAt)} – ${formatEventTime(endAt)}`;
}

export function formatEventDateTimeRange(startAt: Date, endAt: Date): string {
  const sameDay =
    new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: TURKEY_TIME_ZONE,
    }).format(startAt) ===
    new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: TURKEY_TIME_ZONE,
    }).format(endAt);

  if (sameDay) {
    return `${formatEventDateLong(startAt)} · ${formatEventTimeRange(startAt, endAt)}`;
  }

  return `${formatEventDateLong(startAt)} ${formatEventTime(startAt)} – ${formatEventDateLong(endAt)} ${formatEventTime(endAt)}`;
}

export function eventLocationLabel(event: {
  isOnline: boolean;
  locationName: string | null;
}): string {
  return event.isOnline ? "Çevrimiçi" : (event.locationName ?? "Konum belirtilecek");
}
