import { type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { ParentGuidePromo } from "@/presentation/components/home/parent-guide-promo";

function EmptyEventsState() {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-navy-950">Yaklaşan etkinlik bulunamadı</p>
      <p className="mt-1 text-sm text-slate-600">
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
    <section id="events" className="bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-sky-200/90 bg-white shadow-lg shadow-sky-100/50">
          <div className="border-b border-sky-100 px-5 py-6 sm:px-7">
            <h2 className="text-xl font-black text-navy-950 sm:text-2xl">
              Etkinlik seçin, kaydı 3 adımda tamamlayın
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Soldan etkinliği seçin; sağdaki adımlarla veli hesabı açıp çocuğunuzu kaydedin.
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_272px]">
            <div className="p-5 sm:p-7">
              {events.length === 0 ? (
                <EmptyEventsState />
              ) : singleEvent ? (
                <EventCard event={events[0]!} compact />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-sky-100 bg-sky-50/50 p-5 sm:p-7 lg:border-l lg:border-t-0">
              <ParentGuidePromo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
