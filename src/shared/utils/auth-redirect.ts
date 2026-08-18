import type { EmailOtpType } from "@supabase/supabase-js";

import { SITE_URL } from "@/shared/constants/site";

export const PARENT_DEFAULT_LANDING_PATH = "/dashboard/children?add=1";

export function pathnameOnly(path: string): string {
  const trimmed = path.trim();
  const withoutQuery = trimmed.split("?")[0] ?? trimmed;
  return withoutQuery.split("#")[0] ?? withoutQuery;
}

/** Instructor panel routes. `/instructor-login` is not a panel path. */
export function isInstructorAppPath(path: string | null | undefined): boolean {
  const pathname = pathnameOnly(path ?? "");
  return pathname === "/instructor" || pathname.startsWith("/instructor/");
}

export function sanitizeLoginRedirectPath(path: string | null | undefined): string | null {
  const raw = path?.trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export function resolvePostLoginPath(input: {
  requestedPath?: string | null;
  isInstructor?: boolean | null;
  defaultRedirect?: string | null;
  portal: "parent" | "instructor";
}): string {
  const requested = sanitizeLoginRedirectPath(input.requestedPath);
  const fallback = input.defaultRedirect?.startsWith("/")
    ? input.defaultRedirect
    : input.portal === "instructor"
      ? "/instructor"
      : "/dashboard";

  if (input.portal === "instructor") {
    if (requested && isInstructorAppPath(requested)) {
      return requested;
    }
    return "/instructor";
  }

  if (requested && (isInstructorAppPath(requested) || pathnameOnly(requested) === "/instructor-login")) {
    return input.isInstructor ? "/instructor" : fallback;
  }

  return requested ?? fallback;
}

export function sanitizeAuthNextPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

/** Maps legacy parent flows (e.g. /dashboard?enroll=) to the children enrollment UI. */
export function sanitizeParentAuthNextPath(path: string | null | undefined): string {
  const raw = path?.trim();

  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return PARENT_DEFAULT_LANDING_PATH;
  }

  const legacyEnrollMatch = raw.match(/^\/dashboard\?enroll=([^&]+)/);
  if (legacyEnrollMatch) {
    const eventId = decodeURIComponent(legacyEnrollMatch[1]);
    return `/dashboard/children?enroll=1&eventId=${encodeURIComponent(eventId)}`;
  }

  if (raw === "/dashboard") {
    return PARENT_DEFAULT_LANDING_PATH;
  }

  return raw;
}

export function buildEmailConfirmationUrl(input: {
  tokenHash: string;
  type: EmailOtpType;
  nextPath?: string | null;
}): string {
  const next = sanitizeAuthNextPath(input.nextPath);
  const url = new URL("/auth/confirm", SITE_URL);
  url.searchParams.set("token_hash", input.tokenHash);
  url.searchParams.set("type", input.type);
  url.searchParams.set("next", next);
  return url.toString();
}

export function mapVerifyOtpErrorToQueryCode(message: string): "otp_expired" | "auth" {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("invalid") ||
    normalized.includes("already been used")
  ) {
    return "otp_expired";
  }

  return "auth";
}
