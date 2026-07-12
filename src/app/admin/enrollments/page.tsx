import Link from "next/link";
import { redirect } from "next/navigation";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export const dynamic = "force-dynamic";

const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

interface EnrollmentListRow {
  id: string;
  status: EnrollmentStatus;
  registered_at: string;
  events: { id: string; title: string; start_at: string } | { id: string; title: string; start_at: string }[] | null;
  profiles: { id: string; full_name: string; email: string } | { id: string; full_name: string; email: string }[] | null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface AdminEnrollmentsPageProps {
  searchParams: Promise<{ event_id?: string }>;
}

export default async function AdminEnrollmentsPage({ searchParams }: AdminEnrollmentsPageProps) {
  const params = await searchParams;
  const eventId = params.event_id?.trim() || null;

  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);

  if (!access.authorized) {
    redirect("/login");
  }

  let query = client
    .from("enrollments")
    .select(
      `
      id,
      status,
      registered_at,
      events (
        id,
        title,
        start_at
      ),
      profiles (
        id,
        full_name,
        email
      )
    `,
    )
    .order("registered_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  const rows = (data ?? []) as EnrollmentListRow[];

  let filteredEventTitle: string | null = null;
  if (eventId && rows.length > 0) {
    filteredEventTitle = unwrapOne(rows[0].events)?.title ?? null;
  } else if (eventId) {
    const { data: event } = await client.from("events").select("title").eq("id", eventId).maybeSingle();
    filteredEventTitle = event?.title ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Etkinlik Kayıtları
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {filteredEventTitle ? filteredEventTitle : "Tüm Etkinlik Kayıtları"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Öğrencilerin etkinliklere yaptığı kayıtları buradan görüntüleyebilirsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/events"
            className="text-sm font-semibold text-document-primary hover:underline"
          >
            ← Etkinliklere dön
          </Link>
          {eventId ? (
            <Link href="/admin/enrollments" className="text-sm font-semibold text-slate-600 hover:underline">
              Tüm kayıtları göster
            </Link>
          ) : null}
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Kayıtlar yüklenemedi: {error.message}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Öğrenci</th>
                <th className="px-5 py-4">Etkinlik</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    Henüz etkinlik kaydı yok
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const profile = unwrapOne(row.profiles);
                  const event = unwrapOne(row.events);

                  return (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {profile?.full_name ?? "Öğrenci"}
                        </p>
                        <p className="text-xs text-slate-500">{profile?.email ?? "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{event?.title ?? "—"}</p>
                        {event?.start_at ? (
                          <p className="text-xs text-slate-500">{formatDate(event.start_at)}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                          {ENROLLMENT_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(row.registered_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
