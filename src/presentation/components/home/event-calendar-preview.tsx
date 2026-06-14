import { EVENT_TYPE_LABELS, type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { Badge } from "@/presentation/components/ui/badge";

function formatEventDate(date: Date): { day: string; month: string; time: string } {
  return {
    day: new Intl.DateTimeFormat("tr-TR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date),
    time: new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function EventCard({ event }: { event: AcademyEvent }) {
  const start = formatEventDate(event.startAt);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10">
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex min-w-16 flex-col items-center rounded-2xl bg-sky-500 px-3 py-3 text-center text-white">
            <span className="text-2xl font-black leading-none">{start.day}</span>
            <span className="mt-1 text-xs uppercase tracking-wide text-sky-100">{start.month}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="cyan">{EVENT_TYPE_LABELS[event.eventType]}</Badge>
              {event.category ? (
                <Badge tone="navy" style={{ backgroundColor: event.category.color }}>
                  {event.category.name}
                </Badge>
              ) : null}
              {event.isOnline ? <Badge tone="neutral">Online</Badge> : null}
            </div>
            <h3 className="mt-3 text-lg font-bold text-navy-950">{event.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>{start.time}</span>
          <span>{event.isOnline ? "Çevrimiçi" : (event.locationName ?? "Konum belirtilecek")}</span>
        </div>
      </div>
    </article>
  );
}

function EmptyEventsState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-cyan-300/60 bg-cyan-50/40 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-navy-950">Yaklaşan etkinlik bulunamadı</p>
      <p className="mt-2 text-sm text-slate-600">
        Supabase&apos;de yayınlanmış etkinlik eklediğinizde takvim burada otomatik güncellenecek.
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
    <section id="events" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
            Etkinlik Takvimi
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
            Yaklaşan eğitimler ve maker atölyeleri
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Takvim Supabase veritabanından dinamik olarak beslenir. Öğrenciler kayıt oldukça
            kontenjan ve durum bilgisi gerçek zamanlı güncellenir.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="mt-10">
            <EmptyEventsState />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
