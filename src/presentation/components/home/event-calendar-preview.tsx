import { type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { ParentGuidePromo } from "@/presentation/components/home/parent-guide-promo";

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
    <section id="events" className="border-b border-sky-100 bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
            Etkinlik Takvimi
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
            Yaklaşan eğitimler ve maker atölyeleri
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Temel 3D tasarımdan ileri seviye prototiplemeye kadar, uzman mühendisler eşliğinde
            hazırlanan uygulamalı atölyelerimizi keşfedin. Beğendiğiniz etkinliğe kaydolun; üye
            değilseniz önce hesap oluşturmanız istenir.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="order-2 lg:order-1">
              <EmptyEventsState />
            </div>
            <div className="order-1 lg:order-2">
              <ParentGuidePromo />
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="order-2 lg:order-1 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <ParentGuidePromo />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
