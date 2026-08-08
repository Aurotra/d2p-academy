import Link from "next/link";
import { redirect } from "next/navigation";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { SupabaseGradeRepository } from "@/infrastructure/repositories/supabase-grade-repository";
import { ScoreBadge } from "@/presentation/components/grades/score-badge";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(date);
}

export default async function StudentDashboardReportPage() {
  const session = await getStudentSession();
  if (!session) {
    redirect("/student-login");
  }

  let client;
  try {
    client = createServiceRoleClient();
  } catch {
    redirect("/student-login");
  }

  const gradeRepository = new SupabaseGradeRepository(client);
  const grades = await gradeRepository.listGradesByStudent(session.sub);

  return (
    <section className="bg-surface-section px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              Öğrenci / Veli Raporu
            </p>
            <h1 className="mt-2 text-3xl font-black text-navy-950">Not Raporum</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Ödev değerlendirmeleri, puanlar ve gelişim yorumları.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href="/student-dashboard/profile"
              className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
            >
              ← Profilime Dön
            </Link>
            <Link
              href="/student-dashboard/documents"
              className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
            >
              ← Dökümanlara Dön
            </Link>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border-surface bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-navy-900">Henüz not girişiniz yok.</p>
            <p className="mt-2 text-sm text-subtle">
              Eğitmen notlarınızı girdiğinde bu sayfada görünecektir.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-border-surface bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border-surface bg-surface-section text-xs uppercase tracking-wide text-subtle">
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
                    <tr key={grade.id} className="border-b border-border-surface align-top last:border-0">
                      <td className="px-5 py-4 font-semibold text-navy-950">{grade.documentTitle}</td>
                      <td className="px-5 py-4 text-muted">{formatDate(grade.createdAt)}</td>
                      <td className="px-5 py-4 font-bold text-navy-950">{grade.score}</td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={grade.score} />
                      </td>
                      <td className="max-w-sm px-5 py-4 text-[var(--text-on-surface-soft)]">
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
