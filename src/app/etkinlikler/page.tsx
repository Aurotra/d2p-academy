import Link from "next/link";

import { SupabaseEventRepository } from "@/infrastructure/repositories/supabase-event-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventCard } from "@/presentation/components/home/event-card";
import { eventsPageMetadata } from "@/shared/seo/public-pages";

export const dynamic = "force-dynamic";

export const metadata = eventsPageMetadata;

export default async function EventsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-600">
        Etkinlikler şu an yüklenemiyor.
      </div>
    );
  }

  const repository = new SupabaseEventRepository(client);
  const events = await repository.listPublishedUpcoming(50);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Etkinlikler
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Atölye ve eğitim programları
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Robotik, 3D tasarım, 3D baskı ve maker atölyelerimizi keşfedin. Detay sayfasından
            programa göz atıp kayıt olabilirsiniz.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            Şu an yayınlanmış yaklaşan etkinlik yok. Yeni programlar eklendiğinde burada
            listelenecek.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} linkToDetail />
            ))}
          </div>
        )}

        <p className="mt-10 text-sm text-slate-600">
          Kayıt için veli hesabı gerekir.{" "}
          <Link href="/veli-rehberi" className="font-semibold text-document-primary hover:underline">
            Veli kayıt rehberine göz atın →
          </Link>
        </p>
      </div>
    </div>
  );
}
