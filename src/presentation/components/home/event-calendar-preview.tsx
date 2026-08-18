import Link from "next/link";

import { type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { ParentGuidePromo } from "@/presentation/components/home/parent-guide-promo";

function EmptyEventsState() {
  return (
    <div className="px-5 py-10 text-center sm:px-7">
      <p className="text-sm font-semibold text-navy-950">Yaklaşan etkinlik bulunamadı</p>
      <p className="mt-1 text-sm text-muted">
        Yayınlanmış etkinlik eklendiğinde burada listelenecek.
      </p>
    </div>
  );
}

async function getUpcomingEvents(): Promise<AcademyEvent[]> {
  const client = await createSupabaseServerClient();

  if (!client) {
    return [];
  }

  const repository = new SupabaseEventRepository(client);
  return listUpcomingEvents(repository, 6);
}

export async function EventCalendarPreview() {
  let events: AcademyEvent[] = [];

  try {
    events = await getUpcomingEvents();
  } catch {
    events = [];
  }

  return (
    <section id="events" className="bg-surface-section px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-border-surface bg-white shadow-lg shadow-secondary/10">
          <div className="flex flex-col gap-2 border-b border-border-surface px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
            <div>
              <h2 className="text-xl font-black text-navy-950 sm:text-2xl">Yaklaşan atölyeler</h2>
              <p className="mt-1 text-sm text-muted">Tarihi seçin, kaydı başlatın.</p>
            </div>
            <Link
              href="/etkinlikler"
              className="text-sm font-semibold text-document-primary hover:underline"
            >
              Tüm etkinlikler →
            </Link>
          </div>

          {events.length === 0 ? (
            <EmptyEventsState />
          ) : (
            <div className="divide-y divide-border-surface">
              {events.map((event) => (
                <EventCard key={event.id} event={event} compact embedded linkToDetail />
              ))}
            </div>
          )}

          <div className="border-t border-border-surface bg-surface-section/80 px-5 py-4 sm:px-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Veli kaydı · 3 adım
            </p>
            <ParentGuidePromo />
          </div>
        </div>
      </div>
    </section>
  );
}
