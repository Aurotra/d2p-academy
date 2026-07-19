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
      <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-sm sm:p-8">
        <Link
          href={`/admin/enrollments?event_id=${answers.eventId}`}
          className="text-sm font-bold text-document-primary hover:underline"
        >
          ← Etkinlik kayıtlarına dön
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-document-primary">
          Katılımcı Form Cevapları
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-navy-950">
          {answers.studentName}
        </h1>
        <p className="mt-2 text-base font-semibold text-slate-800">{answers.studentEmail}</p>
        <p className="mt-1 text-sm font-medium text-slate-600">{answers.eventTitle}</p>
      </div>

      <AdminEnrollmentFormsView answers={answers} />
    </div>
  );
}
