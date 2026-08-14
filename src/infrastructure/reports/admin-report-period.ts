export const ADMIN_REPORT_TIME_ZONE = "Europe/Istanbul";

/** Turkey has been UTC+3 year-round since 2016. */
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

export type AdminReportPeriodPreset = "this_month" | "last_3_months" | "last_12_months" | "custom";

export type AdminReportRange = {
  preset: AdminReportPeriodPreset;
  startInclusive: Date;
  endExclusive: Date;
  label: string;
};

export function istanbulYmd(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Istanbul calendar wall-clock → UTC Date. */
export function istanbulWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms) - ISTANBUL_OFFSET_MS);
}

export function startOfIstanbulDay(date: Date): Date {
  const { year, month, day } = istanbulYmd(date);
  return istanbulWallTimeToUtc(year, month, day);
}

export function startOfNextIstanbulDay(date: Date): Date {
  const { year, month, day } = istanbulYmd(date);
  return istanbulWallTimeToUtc(year, month, day + 1);
}

function addCalendarMonths(year: number, month: number, day: number, deltaMonths: number): {
  year: number;
  month: number;
  day: number;
} {
  const utc = Date.UTC(year, month - 1 + deltaMonths, day);
  const shifted = new Date(utc);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function isTimestampInRange(iso: string | null | undefined, range: AdminReportRange): boolean {
  if (!iso) {
    return false;
  }
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) {
    return false;
  }
  return time >= range.startInclusive.getTime() && time < range.endExclusive.getTime();
}

export function paymentTimestampInRange(
  paidAt: string | null | undefined,
  createdAt: string | null | undefined,
  range: AdminReportRange,
): boolean {
  return isTimestampInRange(paidAt || createdAt, range);
}

function formatRangeLabel(start: Date, endExclusive: Date): string {
  const lastDay = new Date(endExclusive.getTime() - 1);
  const fmt = new Intl.DateTimeFormat("tr-TR", {
    timeZone: ADMIN_REPORT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(lastDay)}`;
}

export function resolveAdminReportRange(input: {
  preset: string | null | undefined;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): AdminReportRange {
  const now = input.now ?? new Date();
  const today = istanbulYmd(now);
  const tomorrowStart = istanbulWallTimeToUtc(today.year, today.month, today.day + 1);

  if (input.preset === "custom") {
    const fromMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.from?.trim() ?? "");
    const toMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.to?.trim() ?? "");
    if (!fromMatch || !toMatch) {
      throw new Error("Özel tarih aralığı için başlangıç ve bitiş seçin.");
    }
    const start = istanbulWallTimeToUtc(
      Number(fromMatch[1]),
      Number(fromMatch[2]),
      Number(fromMatch[3]),
    );
    const end = istanbulWallTimeToUtc(
      Number(toMatch[1]),
      Number(toMatch[2]),
      Number(toMatch[3]) + 1,
    );
    if (end.getTime() <= start.getTime()) {
      throw new Error("Bitiş tarihi başlangıçtan sonra olmalıdır.");
    }
    return {
      preset: "custom",
      startInclusive: start,
      endExclusive: end,
      label: formatRangeLabel(start, end),
    };
  }

  if (input.preset === "last_3_months") {
    const startYmd = addCalendarMonths(today.year, today.month, today.day, -3);
    const start = istanbulWallTimeToUtc(startYmd.year, startYmd.month, startYmd.day);
    return {
      preset: "last_3_months",
      startInclusive: start,
      endExclusive: tomorrowStart,
      label: formatRangeLabel(start, tomorrowStart),
    };
  }

  if (input.preset === "last_12_months") {
    const startYmd = addCalendarMonths(today.year, today.month, today.day, -12);
    const start = istanbulWallTimeToUtc(startYmd.year, startYmd.month, startYmd.day);
    return {
      preset: "last_12_months",
      startInclusive: start,
      endExclusive: tomorrowStart,
      label: formatRangeLabel(start, tomorrowStart),
    };
  }

  const start = istanbulWallTimeToUtc(today.year, today.month, 1);
  return {
    preset: "this_month",
    startInclusive: start,
    endExclusive: tomorrowStart,
    label: formatRangeLabel(start, tomorrowStart),
  };
}

export function previousEqualRange(range: AdminReportRange): AdminReportRange {
  const durationMs = range.endExclusive.getTime() - range.startInclusive.getTime();
  const startInclusive = new Date(range.startInclusive.getTime() - durationMs);
  const endExclusive = range.startInclusive;
  return {
    preset: range.preset,
    startInclusive,
    endExclusive,
    label: formatRangeLabel(startInclusive, endExclusive),
  };
}

export type AdminReportBucketKind = "week" | "month";

export function reportBucketKind(range: AdminReportRange): AdminReportBucketKind {
  const days = (range.endExclusive.getTime() - range.startInclusive.getTime()) / 86_400_000;
  return days <= 93 ? "week" : "month";
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Monday-start week key in Istanbul: YYYY-MM-DD of that Monday. */
export function istanbulWeekBucketKey(date: Date): string {
  const { year, month, day } = istanbulYmd(date);
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  const weekday = new Date(utcNoon).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(utcNoon + mondayOffset * 86_400_000);
  const y = monday.getUTCFullYear();
  const m = monday.getUTCMonth() + 1;
  const d = monday.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function istanbulMonthBucketKey(date: Date): string {
  const { year, month } = istanbulYmd(date);
  return `${year}-${pad2(month)}`;
}

export function bucketKeyForTimestamp(iso: string, kind: AdminReportBucketKind): string {
  const date = new Date(iso);
  return kind === "week" ? istanbulWeekBucketKey(date) : istanbulMonthBucketKey(date);
}

export function formatBucketLabel(key: string, kind: AdminReportBucketKind): string {
  if (kind === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function enumerateBucketKeys(range: AdminReportRange, kind: AdminReportBucketKind): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(range.startInclusive.getTime() + 12 * 60 * 60 * 1000);
  const end = range.endExclusive.getTime();
  while (cursor.getTime() < end) {
    const key = kind === "week" ? istanbulWeekBucketKey(cursor) : istanbulMonthBucketKey(cursor);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    cursor.setUTCDate(cursor.getUTCDate() + (kind === "week" ? 7 : 20));
  }
  const lastInstant = new Date(range.endExclusive.getTime() - 1);
  const lastKey = kind === "week" ? istanbulWeekBucketKey(lastInstant) : istanbulMonthBucketKey(lastInstant);
  if (!seen.has(lastKey)) {
    keys.push(lastKey);
  }
  return keys;
}
