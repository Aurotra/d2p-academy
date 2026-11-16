import { NextResponse } from "next/server";

interface ApiCatchOptions {
  status?: number;
  logLabel?: string;
}

/** Safe JSON error for API routes — never exposes internal error details to clients. */
export function apiErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Turkish domain messages thrown by repositories — safe to return to clients. */
function isClientSafeTurkishError(message: string): boolean {
  if (!message || message.length > 280) return false;
  // Reject stack traces / English internals
  if (/Error:|at\s+\S+|node_modules|postgres|supabase|ECONN|TypeError/i.test(message)) {
    return false;
  }
  return /[çğıöşüÇĞİÖŞÜ]/.test(message) || /^(Onay|Öğrenci|Sağlık|Veli|Form|Kayıt|Etkinlik|Geçersiz|Tanıma|Ön test|Son test)/i.test(message);
}

export function apiCatchResponse(
  error: unknown,
  fallback: string,
  options?: ApiCatchOptions,
): NextResponse {
  const label = options?.logLabel;
  const message = error instanceof Error ? error.message : undefined;
  if (label) {
    console.error(label, message ?? error);
  } else if (message) {
    console.error(message);
  }

  const clientMessage =
    message && isClientSafeTurkishError(message) ? message : fallback;

  return apiErrorResponse(clientMessage, options?.status ?? 500);
}

export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export function logSupabaseError(label: string, error: { message: string; code?: string }): void {
  console.error(label, error.code ?? "unknown", error.message);
}
