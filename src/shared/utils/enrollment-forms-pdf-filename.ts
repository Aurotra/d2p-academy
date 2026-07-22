const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

function sanitizeFilenamePart(value: string): string {
  return value.replace(INVALID_FILENAME_CHARS, "").replace(/\s+/g, " ").trim();
}

export function buildEnrollmentFormsPdfTitle(input: {
  studentName: string;
  eventProgramCode?: string | null;
  studentCode?: string | null;
}): string {
  const parts = [
    sanitizeFilenamePart(input.studentName),
    input.eventProgramCode ? sanitizeFilenamePart(input.eventProgramCode) : null,
    input.studentCode ? sanitizeFilenamePart(input.studentCode) : null,
  ].filter((part): part is string => Boolean(part));

  const label = parts.length > 0 ? parts.join(" - ") : "Katilimci";
  return `${label} - Formlar`;
}
