import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminFormsFilters } from "@/presentation/components/admin/admin-forms-filters";
import { AdminFormsTable, type AdminFormRow } from "@/presentation/components/admin/admin-forms-table";
import { getEnrollmentFormStatus } from "@/shared/utils/enrollment-form-status";
import type { MediaPermissions } from "@/core/domain/participant-forms";

export const dynamic = "force-dynamic";

interface FormListRow {
  id: string;
  registered_at: string;
  intake_form_completed_at: string | null;
  pre_test_completed_at: string | null;
  post_test_completed_at: string | null;
  events:
    | { id: string; title: string; start_at: string }
    | { id: string; title: string; start_at: string }[]
    | null;
  profiles:
    | {
        full_name: string;
        email: string | null;
        username: string | null;
        grade_level: string | null;
      }
    | {
        full_name: string;
        email: string | null;
        username: string | null;
        grade_level: string | null;
      }[]
    | null;
  consent_records:
    | Array<{
        form_type: string;
        accepted: boolean;
        media_permissions: MediaPermissions | null;
      }>
    | null;
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface AdminFormsPageProps {
  searchParams: Promise<{ event_id?: string; missing?: string }>;
}

export default async function AdminFormsPage({ searchParams }: AdminFormsPageProps) {
  const params = await searchParams;
  const eventId = params.event_id?.trim() || null;
  const missingOnly = params.missing === "1";

  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);
  if (!access.authorized) {
    redirect("/login");
  }

  const { data: eventsData } = await client
    .from("events")
    .select("id, title")
    .order("start_at", { ascending: false });

  let query = client
    .from("enrollments")
    .select(
      `
      id,
      registered_at,
      intake_form_completed_at,
      pre_test_completed_at,
      post_test_completed_at,
      events (
        id,
        title,
        start_at
      ),
      profiles (
        full_name,
        email,
        username,
        grade_level
      ),
      consent_records (
        form_type,
        accepted,
        media_permissions
      )
    `,
    )
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as FormListRow[];

  const tableRows: AdminFormRow[] = rows
    .map((row) => {
      const event = unwrapOne(row.events);
      const profile = unwrapOne(row.profiles);
      const consentRecords = row.consent_records ?? [];
      const status = getEnrollmentFormStatus({
        gradeLevel: profile?.grade_level,
        intakeFormCompletedAt: row.intake_form_completed_at,
        preTestCompletedAt: row.pre_test_completed_at,
        postTestCompletedAt: row.post_test_completed_at,
        consentRecords: consentRecords.map((item) => ({
          form_type: item.form_type,
          accepted: Boolean(item.accepted),
          media_permissions: item.media_permissions,
        })),
      });

      return {
        enrollmentId: row.id,
        studentName: profile?.full_name ?? "Öğrenci",
        studentContact: profile?.email ?? (profile?.username ? `@${profile.username}` : "—"),
        eventId: event?.id ?? "",
        eventTitle: event?.title ?? "Etkinlik",
        eventStartAt: event?.start_at ?? null,
        registeredAt: row.registered_at,
        status,
      };
    })
    .filter((row) => (missingOnly ? !row.status.allRequiredDone : true));

  const completeCount = rows.filter((row) => {
    const profile = unwrapOne(row.profiles);
    const status = getEnrollmentFormStatus({
      gradeLevel: profile?.grade_level,
      intakeFormCompletedAt: row.intake_form_completed_at,
      preTestCompletedAt: row.pre_test_completed_at,
      postTestCompletedAt: row.post_test_completed_at,
      consentRecords: (row.consent_records ?? []).map((item) => ({
        form_type: item.form_type,
        accepted: Boolean(item.accepted),
        media_permissions: item.media_permissions,
      })),
    });
    return status.allRequiredDone;
  }).length;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Formlar
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Doldurulan Katılımcı Formları</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tanışma, Onaylar, Ön test ve Son test sonuçlarına buradan ulaşın. Her satırdan form
          detayını açıp PDF çıktısı alabilirsiniz.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
            {completeCount} tam form
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-900">
            {rows.length - completeCount} eksik
          </span>
          <Link
            href="/admin/enrollments"
            className="font-semibold text-document-primary hover:underline"
          >
            Etkinlik kayıtları →
          </Link>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Formlar yüklenemedi: {error.message}
          </p>
        ) : null}
      </div>

      <Suspense fallback={<div className="text-sm text-slate-500">Filtreler yükleniyor...</div>}>
        <AdminFormsFilters
          events={(eventsData ?? []).map((event) => ({ id: event.id, title: event.title }))}
          currentEventId={eventId}
          missingOnly={missingOnly}
        />
      </Suspense>

      <AdminFormsTable rows={tableRows} />
    </div>
  );
}
