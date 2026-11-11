import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  UpcomingEventsPopup,
  type UpcomingEventPopupItem,
} from "@/presentation/components/home/upcoming-events-popup";

async function loadPopupEvents(): Promise<UpcomingEventPopupItem[]> {
  const client = await createSupabaseServerClient();
  if (!client) {
    return [];
  }

  const events = await listUpcomingEvents(new SupabaseEventRepository(client), 3);
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    eventType: event.eventType,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    locationName: event.locationName,
    isOnline: event.isOnline,
    isPaid: event.isPaid,
    paymentMode: event.paymentMode,
  }));
}

export async function UpcomingEventsPopupHost() {
  let events: UpcomingEventPopupItem[] = [];

  try {
    events = await loadPopupEvents();
  } catch {
    events = [];
  }

  if (events.length === 0) {
    return null;
  }

  return <UpcomingEventsPopup events={events} />;
}
