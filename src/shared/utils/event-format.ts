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

function istanbulDateParts(date: Date): { day: string; month: string; year: string; key: string } {
  const parts = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TURKEY_TIME_ZONE,
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const key = new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  }).format(date);

  return { day, month, year, key };
}

/** Compact public date span, e.g. "17 Kasım" or "17–19 Kasım". */
export function formatEventDateRange(startAt: Date, endAt: Date): string {
  if (!isValidDate(startAt)) {
    return "Tarih yakında";
  }

  const start = istanbulDateParts(startAt);
  if (!isValidDate(endAt) || endAt.getTime() < startAt.getTime()) {
    return `${start.day} ${start.month}`;
  }

  const end = istanbulDateParts(endAt);
  if (start.key === end.key) {
    return `${start.day} ${start.month}`;
  }

  if (start.month === end.month && start.year === end.year) {
    return `${start.day}–${end.day} ${start.month}`;
  }

  if (start.year === end.year) {
    return `${start.day} ${start.month} – ${end.day} ${end.month}`;
  }

  return `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`;
}

export function eventLocationLabel(event: {
  isOnline: boolean;
  locationName: string | null;
}): string {
  return event.isOnline ? "Çevrimiçi" : (event.locationName ?? "Konum belirtilecek");
}
