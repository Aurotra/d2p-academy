import type { EventType } from "@/core/domain/event";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

export interface AdminEventRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  eventType: EventType;
  categoryId: string | null;
  categoryName: string | null;
  startAt: Date;
  endAt: Date;
  dailyLessonStart: string;
  dailyLessonEnd: string;
  lessonDurationMinutes: number;
  totalLessonCount: number | null;
  requiredLessonCount: number | null;
  locationName: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  maxCapacity: number | null;
  status: EventStatus;
  programCode: string | null;
  coverImageUrl: string | null;
  instructorIds: string[];
  instructorNames: string[];
  /** @deprecated İlk eğitmen — geriye dönük uyumluluk */
  instructorId: string | null;
  /** @deprecated Virgülle ayrılmış eğitmen adları */
  instructorName: string | null;
}

export interface InstructorOption {
  id: string;
  fullName: string;
  email: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  eventType: EventType;
  categoryId: string | null;
  startAt: string;
  endAt: string;
  dailyLessonStart: string;
  dailyLessonEnd: string;
  lessonDurationMinutes: number;
  totalLessonCount: number | null;
  requiredLessonCount: number | null;
  locationName: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  maxCapacity: number | null;
  status: EventStatus;
  programCode: string | null;
  instructorIds: string[];
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export interface EventCategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  groupName: string;
}
