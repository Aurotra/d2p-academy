import type { EventType } from "@/core/domain/event";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type EventPaymentMode = "free" | "iyzico" | "external";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

export const EVENT_PAYMENT_MODE_LABELS: Record<EventPaymentMode, string> = {
  free: "Ücretsiz",
  iyzico: "Kartla ödeme (PayTR)",
  external: "Kurum/okul tahsilatı",
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
  /** Legacy mirror of paymentMode === 'iyzico'. Prefer paymentMode. */
  isPaid: boolean;
  paymentMode: EventPaymentMode;
  priceTryCents: number | null;
  displayPriceTryCents: number | null;
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
  paymentMode: EventPaymentMode;
  /** Kept for backward-compatible clients; derived from paymentMode when omitted. */
  isPaid?: boolean;
  priceTryCents: number | null;
  displayPriceTryCents?: number | null;
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
