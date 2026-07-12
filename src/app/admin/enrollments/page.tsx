import Link from "next/link";
import { redirect } from "next/navigation";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EnrollmentCompleteButton } from "@/presentation/components/admin/enrollment-complete-button";

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

interface GroupedEnrollment {
  id: string;
  status: EnrollmentStatus;
  registeredAt: string;
  studentName: string;
  studentEmail: string;
}

interface EventEnrollmentGroup {
  eventId: string;
  eventTitle: string;
  eventStartAt: string | null;
  enrollments: GroupedEnrollment[];
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

function groupByEvent(rows: EnrollmentListRow[]): EventEnrollmentGroup[] {
  const groups = new Map<string, EventEnrollmentGroup>();

  for (const row of rows) {
    const event = unwrapOne(row.events);
    const profile = unwrapOne(row.profiles);
    const eventKey = event?.id ?? "unknown";
    const eventTitle = event?.title ?? "Etkinlik bulunamadı";
    const eventStartAt = event?.start_at ?? null;

    const enrollment: GroupedEnrollment = {
      id: row.id,
      status: row.status,
      registeredAt: row.registered_at,
      studentName: profile?.full_name ?? "Öğrenci",
      studentEmail: profile?.email ?? "—",
    };

    const existing = groups.get(eventKey);
    if (existing) {
      existing.enrollments.push(enrollment);
    } else {
      groups.set(eventKey, {
        eventId: eventKey,
        eventTitle,
        eventStartAt,
        enrollments: [enrollment],
      });
    }
  }

  return Array.from(groups.values()).sort((left, right) => {
    const leftTime = left.eventStartAt ? new Date(left.eventStartAt).getTime() : 0;
    const rightTime = right.eventStartAt ? new Date(right.eventStartAt).getTime() : 0;
    return leftTime - rightTime;
  });
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
  const groups = groupByEvent(rows);

  let filteredEventTitle: string | null = null;
  if (eventId && groups.length > 0) {
    filteredEventTitle = groups[0].eventTitle;
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
          Eğitim bitince öğrenciyi Tamamlandı işaretleyin; ardından Sertifika Yönetimi’nden
          sertifika verebilirsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/events"
            className="text-sm font-semibold text-document-primary hover:underline"
          >
            ← Etkinliklere dön
          </Link>
          <Link
            href="/admin/certificates"
            className="text-sm font-semibold text-document-primary hover:underline"
          >
            Sertifika Yönetimi →
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

      {groups.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Henüz etkinlik kaydı yok
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.eventId}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{group.eventTitle}</h2>
                  {group.eventStartAt ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Etkinlik tarihi: {formatDate(group.eventStartAt)}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex w-fit rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                  {group.enrollments.length} kayıt
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Öğrenci</th>
                      <th className="px-5 py-3">Durum</th>
                      <th className="px-5 py-3">Kayıt Tarihi</th>
                      <th className="px-5 py-3">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{enrollment.studentName}</p>
                          <p className="text-xs text-slate-500">{enrollment.studentEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                            {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(enrollment.registeredAt)}
                        </td>
                        <td className="px-5 py-4">
                          <EnrollmentCompleteButton
                            enrollmentId={enrollment.id}
                            status={enrollment.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
