import Link from "next/link";

import { type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { ParentGuidePromo } from "@/presentation/components/home/parent-guide-promo";

function EmptyEventsState() {
  return (
    <div className="rounded-2xl border border-dashed border-border-surface bg-surface-tint-green/40 px-5 py-8 text-center">
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

  const singleEvent = events.length === 1;

  return (
    <section id="events" className="bg-surface-section px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-border-surface bg-white shadow-lg shadow-secondary/10">
          <div className="border-b border-border-surface px-5 py-6 sm:px-7">
            <h2 className="text-xl font-black text-navy-950 sm:text-2xl">
              Etkinlik seçin, kaydı 3 adımda tamamlayın
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Soldan etkinliği seçin; sağdaki adımlarla veli hesabı açıp çocuğunuzu kaydedin.{" "}
              <Link href="/etkinlikler" className="font-semibold text-document-primary hover:underline">
                Tüm etkinlikler →
              </Link>
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-stretch">
            <div className="flex min-h-0 flex-col lg:h-full">
              {events.length === 0 ? (
                <div className="p-5 sm:p-7">
                  <EmptyEventsState />
                </div>
              ) : (
                <div
                  className={
                    singleEvent
                      ? "flex h-full min-h-[240px] flex-1 flex-col lg:min-h-full"
                      : "flex flex-col divide-y divide-border-surface"
                  }
                >
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact
                      embedded
                      fill={singleEvent}
                      linkToDetail
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border-surface bg-surface-tint-yellow/30 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <ParentGuidePromo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
