import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseStudentProfileRepository } from "@/infrastructure/repositories/supabase-student-profile-repository";
import { AdminStudentProfileEditor } from "@/presentation/components/admin/admin-student-profile-editor";

export const dynamic = "force-dynamic";

interface AdminStudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
  const { id } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    notFound();
  }

  const repository = new SupabaseStudentProfileRepository(client);
  const student = await repository.getByUserId(id);

  if (!student || student.role !== "student") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/admin/students"
          className="text-sm font-semibold text-document-primary hover:text-document-primary-hover"
        >
          ← Öğrenci Listesi
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {student.profile_avatar_url ? (
              <Image
                src={student.profile_avatar_url}
                alt={student.full_name}
                width={72}
                height={72}
                className="rounded-2xl border border-slate-200 object-cover"
              />
            ) : null}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
                Profil Düzenleme
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{student.full_name}</h1>
              <p className="text-sm text-slate-500">{student.email}</p>
            </div>
          </div>
          <Link
            href={`/dashboard/report?student_id=${student.id}`}
            className="inline-flex rounded-xl bg-document-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-document-primary-hover"
          >
            Not Raporunu Gör
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Yanlış girilen bilgileri buradan düzeltebilirsiniz. E-posta hesabı güvenlik nedeniyle
          değiştirilemez.
        </p>
      </div>

      <AdminStudentProfileEditor student={student} />
    </div>
  );
}
