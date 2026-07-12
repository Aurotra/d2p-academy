import Link from "next/link";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseStudentProfileRepository } from "@/infrastructure/repositories/supabase-student-profile-repository";
import { calculateProgress } from "@/lib/utils/progress";
import { GRADE_LEVEL_OPTIONS } from "@/shared/constants/profile-options";

export const dynamic = "force-dynamic";

function formatGradeLevel(value: string | null | undefined): string {
  if (!value) return "—";
  return GRADE_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default async function AdminStudentsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    return null;
  }

  const repository = new SupabaseStudentProfileRepository(client);
  const students = await repository.listStudents();

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Öğrenci Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Kayıtlı Öğrenciler</h1>
        <p className="mt-2 text-sm text-slate-600">
          Profil cevaplarını ve ödev not raporlarını buradan görüntüleyin.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Öğrenci</th>
                <th className="px-5 py-4">Okul</th>
                <th className="px-5 py-4">Sınıf</th>
                <th className="px-5 py-4">Tamamlanma %</th>
                <th className="px-5 py-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Kayıtlı öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const progress = calculateProgress({
                    full_name: student.full_name,
                    gender: student.gender,
                    grade_level: student.grade_level,
                    school_name: student.school_name,
                    city_district: student.city_district,
                    experience_data: {
                      coding_experience: student.experience_data.coding_experience,
                      proje_sayisi:
                        student.experience_data.proje_sayisi === ""
                          ? null
                          : Number(student.experience_data.proje_sayisi),
                    },
                    interests: student.interests,
                    motivation_data: {
                      hedef: student.motivation_data.hedef,
                      beklenti:
                        student.motivation_data.beklenti === ""
                          ? null
                          : Number(student.motivation_data.beklenti),
                    },
                    profile_avatar_url: student.profile_avatar_url,
                  });

                  return (
                    <tr key={student.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{student.school_name || "—"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {formatGradeLevel(student.grade_level)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                          %{progress}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="inline-flex justify-center rounded-xl border border-document-primary px-3 py-2 text-xs font-semibold text-document-primary transition hover:bg-document-primary/5"
                          >
                            Profil Cevapları
                          </Link>
                          <Link
                            href={`/dashboard/report?student_id=${student.id}`}
                            className="inline-flex justify-center rounded-xl bg-document-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-document-primary-hover"
                          >
                            Not Raporu
                          </Link>
                        </div>
                      </td>
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
