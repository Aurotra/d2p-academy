import Link from "next/link";
import { redirect } from "next/navigation";

import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { listEventAttendanceDates } from "@/shared/utils/event-attendance-dates";

export const dynamic = "force-dynamic";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function InstructorHomePage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login?redirectTo=/instructor");
  }

  const access = await getInstructorAccess(client);
  if (!access.authorized) {
    redirect("/login?redirectTo=/instructor");
  }

  const { data: events, error } = await client
    .from("events")
    .select("id, title, start_at, end_at, status, location_name")
    .eq("instructor_id", access.profile.id)
    .order("start_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Eğitmen Paneli
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Etkinliklerim</h1>
        <p className="mt-2 text-sm text-slate-600">
          Size atanmış etkinliklerde günlük yoklama alabilirsiniz. Her etkinlik günü için öğrencinin
          gelip gelmediğini işaretleyin.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Etkinlikler yüklenemedi: {error.message}
        </p>
      ) : null}

      {!events || events.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Size atanmış etkinlik yok. Admin etkinlik oluştururken sizi eğitmen olarak atamalıdır.
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const dayCount = listEventAttendanceDates(
              new Date(event.start_at),
              new Date(event.end_at),
            ).length;

            return (
              <article
                key={event.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDateTime(event.start_at)} – {formatDateTime(event.end_at)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {dayCount} yoklama günü
                      {event.location_name ? ` · ${event.location_name}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/instructor/events/${event.id}/attendance`}
                    className="inline-flex items-center justify-center rounded-xl bg-document-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
                  >
                    Yoklama Al
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
