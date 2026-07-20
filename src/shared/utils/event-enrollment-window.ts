export const EVENT_ENROLLMENT_CLOSED_MESSAGE =
  "Bu etkinliğin süresi dolmuş; kayıt yapılamaz.";

export const EVENT_NOT_PUBLISHED_MESSAGE = "Bu etkinlik şu anda kayda açık değil.";

type EventEnrollmentWindowInput = {
  status: string;
  end_at?: string | null;
  endAt?: Date | string | null;
};

/** Published and end time not yet passed. */
export function isEventOpenForEnrollment(event: EventEnrollmentWindowInput): boolean {
  if (event.status !== "published") {
    return false;
  }

  const endValue = event.end_at ?? event.endAt;
  if (!endValue) {
    return false;
  }

  const endAt = endValue instanceof Date ? endValue : new Date(endValue);
  if (Number.isNaN(endAt.getTime())) {
    return false;
  }

  return endAt.getTime() >= Date.now();
}

export function getEventEnrollmentBlockReason(
  event: EventEnrollmentWindowInput,
): string | null {
  if (event.status !== "published") {
    return EVENT_NOT_PUBLISHED_MESSAGE;
  }
  if (!isEventOpenForEnrollment(event)) {
    return EVENT_ENROLLMENT_CLOSED_MESSAGE;
  }
  return null;
}
