import { NextResponse } from "next/server";

interface ApiCatchOptions {
  status?: number;
  logLabel?: string;
}

/** Safe JSON error for API routes — never exposes internal error details to clients. */
export function apiErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiCatchResponse(
  error: unknown,
  fallback: string,
  options?: ApiCatchOptions,
): NextResponse {
  const label = options?.logLabel;
  if (label) {
    console.error(label, error instanceof Error ? error.message : error);
  } else if (error instanceof Error) {
    console.error(error.message);
  }

  return apiErrorResponse(fallback, options?.status ?? 500);
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
