import { type AcademyEvent } from "@/core/domain/event";
import { listUpcomingEvents } from "@/core/use-cases/list-upcoming-events";
import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { ParentGuidePromo } from "@/presentation/components/home/parent-guide-promo";

function EmptyEventsState() {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-10 text-center">
      <p className="text-base font-semibold text-navy-950">Yaklaşan etkinlik bulunamadı</p>
      <p className="mt-2 text-sm text-slate-600">
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

  const eventGridClass =
    events.length > 1 ? "grid gap-5 sm:grid-cols-2" : "grid max-w-xl gap-5 grid-cols-1";

  return (
    <section id="events" className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-xl shadow-sky-100/60">
          <header className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-6 py-8 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="rounded-full bg-white px-3 py-1 text-cyan-700 ring-1 ring-sky-200">
                Etkinlik Takvimi
              </span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-secondary ring-1 ring-emerald-200">
                Veli Kaydı
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black text-navy-950 sm:text-3xl lg:text-4xl">
              Etkinliklere katılın, veli rehberiyle kaydı tamamlayın
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Sağdaki adımlarla veli hesabınızı açın; soldan etkinlik seçip çocuğunuzu kaydedin.
              Üye değilseniz önce hesap oluşturmanız yeterli.
            </p>
          </header>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <div className="border-b border-sky-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">
                Yaklaşan etkinlikler
              </p>
              <h3 className="mt-1 text-lg font-bold text-navy-950">Maker atölyeleri ve eğitimler</h3>

              <div className={`mt-5 ${eventGridClass}`}>
                {events.length === 0 ? (
                  <EmptyEventsState />
                ) : (
                  events.map((event) => <EventCard key={event.id} event={event} />)
                )}
              </div>
            </div>

            <div className="bg-gradient-to-b from-emerald-50/60 to-white p-6 sm:p-8">
              <ParentGuidePromo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
