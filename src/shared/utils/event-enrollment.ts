export function buildEventEnrollPath(eventId: string): string {
  return `/dashboard/children?enroll=1&eventId=${encodeURIComponent(eventId)}`;
}

export function buildAdminEventEnrollPath(eventId: string): string {
  return `/admin/enrollments?event_id=${encodeURIComponent(eventId)}`;
}

/** Public CTA destination after the visitor is already signed in. */
export function buildLoggedInEventEnrollPath(
  eventId: string,
  input: { sessionKind?: string | null; userRole?: string | null },
): string {
  if (input.sessionKind === "student") {
    return "/student-dashboard";
  }
  if (input.userRole === "admin") {
    return buildAdminEventEnrollPath(eventId);
  }
  return buildEventEnrollPath(eventId);
}

export function buildChildProfileForEnrollPath(
  childId: string,
  options?: { eventId?: string },
): string {
  const params = new URLSearchParams();
  if (options?.eventId) {
    params.set("eventId", options.eventId);
  } else {
    params.set("enroll", "1");
  }
  return `/dashboard/children/${childId}/profile?${params.toString()}`;
}

export function isChildProfileReadyForEnrollment(profileProgress?: number): boolean {
  return (profileProgress ?? 0) >= 100;
}

export function buildRegisterForEventPath(eventId: string): string {
  return `/register?redirectTo=${encodeURIComponent(buildEventEnrollPath(eventId))}`;
}

export function buildLoginForEventPath(eventId: string): string {
  return `/login?redirectTo=${encodeURIComponent(buildEventEnrollPath(eventId))}`;
}
