import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { SupabaseParticipantFormsRepository } from "@/infrastructure/repositories/supabase-participant-forms-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminEnrollmentFormsView } from "@/presentation/components/admin/admin-enrollment-forms-view";

export const dynamic = "force-dynamic";

interface AdminEnrollmentFormsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEnrollmentFormsPage({
  params,
}: AdminEnrollmentFormsPageProps) {
  const { id } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);
  if (!access.authorized) {
    redirect("/login");
  }

  const repository = new SupabaseParticipantFormsRepository(client);

  let answers;
  try {
    answers = await repository.getEnrollmentFormAnswers(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href={`/admin/enrollments?event_id=${answers.eventId}`}
          className="text-sm font-semibold text-document-primary hover:underline"
        >
          ← Etkinlik kayıtlarına dön
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Katılımcı Form Cevapları
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{answers.studentName}</h1>
        <p className="mt-1 text-sm text-slate-600">{answers.studentEmail}</p>
        <p className="mt-2 text-sm text-slate-500">{answers.eventTitle}</p>
      </div>

      <AdminEnrollmentFormsView answers={answers} />
    </div>
  );
}
