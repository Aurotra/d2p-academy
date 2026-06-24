import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGradeRepository } from "@/infrastructure/repositories/supabase-grade-repository";
import { SupabaseStudentProfileRepository } from "@/infrastructure/repositories/supabase-student-profile-repository";
import { ScoreBadge } from "@/presentation/components/grades/score-badge";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(date);
}

interface DashboardReportPageProps {
  searchParams: Promise<{ student_id?: string }>;
}

export default async function DashboardReportPage({ searchParams }: DashboardReportPageProps) {
  const { student_id: requestedStudentId } = await searchParams;
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminAccess = await getAdminAccess(client);
  const targetStudentId =
    adminAccess.authorized && requestedStudentId ? requestedStudentId : user.id;

  if (targetStudentId !== user.id && !adminAccess.authorized) {
    redirect("/dashboard/report");
  }

  const gradeRepository = new SupabaseGradeRepository(client);
  const profileRepository = new SupabaseStudentProfileRepository(client);
  const [grades, studentProfile] = await Promise.all([
    gradeRepository.listGradesByStudent(targetStudentId),
    profileRepository.getByUserId(targetStudentId),
  ]);

  const isAdminView = adminAccess.authorized && targetStudentId !== user.id;

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              {isAdminView ? "Admin Görünümü" : "Öğrenci / Veli Raporu"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              {isAdminView ? `${studentProfile?.full_name ?? "Öğrenci"} — Not Raporu` : "Not Raporum"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Ödev değerlendirmeleri, puanlar ve gelişim yorumları.
            </p>
          </div>
          <Link
            href={isAdminView ? "/admin/students" : "/dashboard/documents"}
            className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
          >
            {isAdminView ? "← Öğrenci Listesi" : "← Dökümanlara Dön"}
          </Link>
        </div>

        {grades.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-800">Henüz not girişiniz yok.</p>
            <p className="mt-2 text-sm text-slate-500">
              Eğitmen notlarınızı girdiğinde bu sayfada görünecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Döküman</th>
                    <th className="px-5 py-4">Tarih</th>
                    <th className="px-5 py-4">Puan</th>
                    <th className="px-5 py-4">Durum</th>
                    <th className="px-5 py-4">Gelişim Yorumu</th>
                    <th className="px-5 py-4">Dosya</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id} className="border-b border-slate-50 align-top last:border-0">
                      <td className="px-5 py-4 font-semibold text-slate-900">{grade.documentTitle}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(grade.createdAt)}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{grade.score}</td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={grade.score} />
                      </td>
                      <td className="max-w-sm px-5 py-4 text-slate-700">
                        {grade.feedback || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={grade.documentFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-lg border border-document-primary/30 px-3 py-1.5 text-xs font-semibold text-document-primary hover:bg-document-primary/5"
                        >
                          PDF Aç
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
