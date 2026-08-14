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
  /** When true, registration requires successful payment before status becomes registered. */
  isPaid: boolean;
  /** Fee in TRY kuruş (15000 = 150.00 TL). Null when free. */
  priceTryCents: number | null;
  coverImageUrl: string | null;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: "Eğitim",
  maker_workshop: "Maker Atölyesi",
  bootcamp: "Yoğun Kamp",
  seminar: "Seminer",
};
