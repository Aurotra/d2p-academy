import type { EventPaymentMode } from "@/core/domain/admin-event";

export type { EventPaymentMode };

export type EventType = "training" | "maker_workshop" | "bootcamp" | "seminar";

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  eventType: EventType;
  category: EventCategory | null;
  startAt: Date;
  endAt: Date;
  locationName: string | null;
  isOnline: boolean;
  /**
   * Legacy mirror of paymentMode === 'iyzico'. Prefer paymentMode for behavior.
   * Kept for backward compatibility; DB trigger keeps it in sync.
   */
  isPaid: boolean;
  paymentMode: EventPaymentMode;
  /** Checkout fee in TRY kuruş (iyzico). Null when free/external. */
  priceTryCents: number | null;
  /** Optional informational price for external (kurum) mode; does not trigger payment. */
  displayPriceTryCents: number | null;
  coverImageUrl: string | null;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: "Eğitim",
  maker_workshop: "Maker Atölyesi",
  bootcamp: "Yoğun Kamp",
  seminar: "Seminer",
};
