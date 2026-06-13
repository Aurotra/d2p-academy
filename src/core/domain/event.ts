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
  coverImageUrl: string | null;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: "Eğitim",
  maker_workshop: "Maker Atölyesi",
  bootcamp: "Bootcamp",
  seminar: "Seminer",
};
