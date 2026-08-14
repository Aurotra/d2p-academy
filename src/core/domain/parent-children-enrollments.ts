import type { EventType } from "@/core/domain/event";

export interface ParentChildEnrollmentItem {
  enrollmentId: string;
  childId: string;
  childName: string;
  childUsername: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventType: EventType;
  categoryName: string | null;
  categoryColor: string | null;
  startAt: string;
  endAt: string;
  locationName: string | null;
  isOnline: boolean;
  status: string;
  registeredAt: string;
  intakeCompleted: boolean;
  consentsCompleted: boolean;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
  postTestUnlocked: boolean;
  postTestDeadlineAt: string | null;
  requiresPreTest: boolean;
  requiresSurveys: boolean;
  presentCount: number;
  requiredLessonCount: number;
  totalLessonCount: number;
  attendanceComplete: boolean;
}

export interface ParentChildrenEnrollmentsData {
  childrenCount: number;
  enrollments: ParentChildEnrollmentItem[];
}
