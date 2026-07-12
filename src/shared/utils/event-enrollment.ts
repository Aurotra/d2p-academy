export function buildEventEnrollPath(eventId: string): string {
  return `/dashboard?enroll=${encodeURIComponent(eventId)}`;
}

export function buildRegisterForEventPath(eventId: string): string {
  return `/register?redirectTo=${encodeURIComponent(buildEventEnrollPath(eventId))}`;
}

export function buildLoginForEventPath(eventId: string): string {
  return `/login?redirectTo=${encodeURIComponent(buildEventEnrollPath(eventId))}`;
}
