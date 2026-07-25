import type { ProgramDefinition } from "@/core/domain/program";

export function formatProgramDuration(program: {
  durationWeeks?: number | null;
  durationHours?: number | null;
}): string | null {
  const parts: string[] = [];

  if (program.durationWeeks != null && !Number.isNaN(program.durationWeeks)) {
    const weeksLabel = Number.isInteger(program.durationWeeks)
      ? `${program.durationWeeks}`
      : `${program.durationWeeks}`;
    parts.push(`${weeksLabel} hafta`);
  }

  if (program.durationHours != null && !Number.isNaN(program.durationHours)) {
    const hoursLabel = Number.isInteger(program.durationHours)
      ? `${program.durationHours}`
      : `${program.durationHours}`;
    parts.push(`${hoursLabel} saat`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}

export function formatProgramDurationSentence(program: {
  durationWeeks?: number | null;
  durationHours?: number | null;
}): string | null {
  const duration = formatProgramDuration(program);
  if (!duration) {
    return null;
  }

  return `Bu program yaklaşık ${duration} sürmektedir.`;
}

/** Suggest end date from start + fractional weeks (calendar days). */
export function suggestEndDateFromWeeks(startDate: string, durationWeeks: number): string {
  const start = new Date(`${startDate}T12:00:00`);
  const totalDays = Math.round(durationWeeks * 7);
  start.setDate(start.getDate() + totalDays);

  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function programDurationShortLabel(program: ProgramDefinition | null | undefined): string | null {
  if (!program) {
    return null;
  }

  return formatProgramDuration(program);
}
