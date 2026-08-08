import Link from "next/link";
import { redirect } from "next/navigation";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { isStudentParticipantProfile } from "@/shared/utils/student-participant-profile";
import {
  EventEnrollmentsTable,
  type EventEnrollmentRow,
} from "@/presentation/components/admin/event-enrollments-table";
import { AdminAddEnrollmentForm } from "@/presentation/components/admin/admin-add-enrollment-form";
import { ADMIN_ENROLLMENT_VISIBLE_EVENT_STATUSES, isAdminEnrollmentVisibleEventStatus } from "@/shared/constants/event-status";

export const dynamic = "force-dynamic";

interface EnrollmentListRow {
  id: string;
  status: EnrollmentStatus;
  registered_at: string;
  events: { id: string; title: string; start_at: string; status: string } | { id: string; title: string; start_at: string; status: string }[] | null;
  profiles: {
    id: string;
    full_name: string;
    email: string | null;
    username: string | null;
    role: string;
  } | {
    id: string;
    full_name: string;
    email: string | null;
    username: string | null;
    role: string;
  }[] | null;
  certificates:
    | { id: string; status: string }
    | { id: string; status: string }[]
    | null;
}

interface EventEnrollmentGroup {
  eventId: string;
  eventTitle: string;
  eventStartAt: string | null;
  enrollments: EventEnrollmentRow[];
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
    if (!profile || !isStudentParticipantProfile(profile)) {
      continue;
    }
    if (!event || !isAdminEnrollmentVisibleEventStatus(event.status)) {
      continue;
    }
    const eventKey = event?.id ?? "unknown";
    const eventTitle = event?.title ?? "Etkinlik bulunamadı";
    const eventStartAt = event?.start_at ?? null;

    const certificates = Array.isArray(row.certificates)
      ? row.certificates
      : row.certificates
        ? [row.certificates]
        : [];

    const enrollment: EventEnrollmentRow = {
      id: row.id,
      status: row.status,
      registeredAt: row.registered_at,
      studentName: profile?.full_name ?? "Öğrenci",
      studentEmail:
        profile?.email ??
        (profile?.username ? `@${profile.username}` : "—"),
      hasActiveCertificate: certificates.some((certificate) => certificate.status === "active"),
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
  searchParams: Promise<{ event_id?: string; include_cancelled?: string }>;
}

export default async function AdminEnrollmentsPage({ searchParams }: AdminEnrollmentsPageProps) {
  const params = await searchParams;
  const eventId = params.event_id?.trim() || null;
  const includeCancelled = params.include_cancelled === "1";

  const sessionClient = await createSupabaseServerClient();

  if (!sessionClient) {
    redirect("/login");
  }

  const access = await getAdminAccess(sessionClient);

  if (!access.authorized) {
    redirect("/login");
  }

  const client = await getAdminDataClient();

  let query = client
    .from("enrollments")
    .select(
      `
      id,
      status,
      registered_at,
      events!inner (
        id,
        title,
        start_at,
        status
      ),
      profiles (
        id,
        full_name,
        email,
        username,
        role
      ),
      certificates (
        id,
        status
      )
    `,
    )
    .in("events.status", [...ADMIN_ENROLLMENT_VISIBLE_EVENT_STATUSES])
    .order("registered_at", { ascending: false });

  if (!includeCancelled) {
    query = query.neq("status", "cancelled");
  }

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as EnrollmentListRow[];
  const groups = groupByEvent(rows);

  let filteredEventTitle: string | null = null;
  let filteredEventStatus: string | null = null;
  if (eventId && groups.length > 0) {
    filteredEventTitle = groups[0].eventTitle;
  } else if (eventId) {
    const { data: event } = await client
      .from("events")
      .select("title, status")
      .eq("id", eventId)
      .maybeSingle();
    filteredEventTitle = event?.title ?? null;
    filteredEventStatus = event?.status ?? null;
  }

  const filteredEventIsVisible =
    !filteredEventStatus || isAdminEnrollmentVisibleEventStatus(filteredEventStatus);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Etkinlik Kayıtları
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-950">
          {filteredEventTitle ? filteredEventTitle : "Tüm Etkinlik Kayıtları"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Eğitim bitince öğrenciyi Tamamlandı olarak onaylayın (tek tek veya toplu); ardından
          Sertifika Yönetimi’nden sertifika verebilirsiniz. Yanlış kayıt veya katılmayacak öğrenciler
          için satırdaki veya toplu <span className="font-semibold">Kurstan çıkar</span> ile kayıt
          tamamen silinir (yoklama ve formlar dahil).
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
            <Link
              href={`/admin/events/${eventId}/attendance`}
              className="text-sm font-semibold text-document-primary hover:underline"
            >
              Yoklama →
            </Link>
          ) : null}
          {eventId ? (
            <Link href="/admin/enrollments" className="text-sm font-semibold text-muted hover:underline">
              Tüm kayıtları göster
            </Link>
          ) : null}
          {eventId ? (
            includeCancelled ? (
              <Link
                href={`/admin/enrollments?event_id=${eventId}`}
                className="text-sm font-semibold text-muted hover:underline"
              >
                Çıkarılanları gizle
              </Link>
            ) : (
              <Link
                href={`/admin/enrollments?event_id=${eventId}&include_cancelled=1`}
                className="text-sm font-semibold text-muted hover:underline"
              >
                Çıkarılanları göster
              </Link>
            )
          ) : null}
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Kayıtlar yüklenemedi: {error.message}
          </p>
        ) : null}
        {eventId && filteredEventTitle && !filteredEventIsVisible ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Bu etkinlik yayından değil (taslak veya iptal). Kayıtlar yalnızca yayında veya
            tamamlanmış etkinlikler için listelenir.
          </p>
        ) : null}
      </div>

      {eventId && filteredEventTitle && filteredEventIsVisible ? (
        <AdminAddEnrollmentForm eventId={eventId} eventTitle={filteredEventTitle} />
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-border-surface bg-white px-6 py-12 text-center text-sm text-subtle">
          {eventId
            ? "Bu etkinlikte henüz kayıt yok. Yukarıdan öğrenci ekleyebilirsiniz."
            : "Henüz etkinlik kaydı yok"}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.eventId}
              className="overflow-hidden rounded-[1.75rem] border border-border-surface bg-white shadow-sm"
            >
              <div className="flex flex-col gap-2 border-b border-border-surface bg-surface-section px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy-950">{group.eventTitle}</h2>
                  {group.eventStartAt ? (
                    <p className="mt-1 text-sm text-subtle">
                      Etkinlik tarihi: {formatDate(group.eventStartAt)}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex w-fit rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                  {group.enrollments.length} kayıt
                </span>
              </div>

              <EventEnrollmentsTable
                eventTitle={group.eventTitle}
                enrollments={group.enrollments}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
