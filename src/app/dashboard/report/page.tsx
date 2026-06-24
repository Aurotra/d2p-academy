import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGradeRepository } from "@/infrastructure/repositories/supabase-grade-repository";
import { ScoreBadge } from "@/presentation/components/grades/score-badge";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(date);
}

export default async function DashboardReportPage() {
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

  const repository = new SupabaseGradeRepository(client);
  const grades = await repository.listGradesByStudent(user.id);

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              Öğrenci / Veli Raporu
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Not Raporum</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Ödev ve döküman değerlendirmelerinizi buradan takip edebilirsiniz.
            </p>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
          >
            ← Dökümanlara Dön
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
          <div className="space-y-4">
            {grades.map((grade) => (
              <article
                key={grade.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{grade.documentTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(grade.createdAt)}</p>
                  </div>
                  <ScoreBadge score={grade.score} />
                </div>

                {grade.feedback ? (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Geri Bildirim
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{grade.feedback}</p>
                  </div>
                ) : null}

                <a
                  href={grade.documentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-document-primary/30 px-4 py-2.5 text-sm font-semibold text-document-primary transition hover:bg-document-primary/5"
                >
                  Ödev Dosyasını Aç
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
