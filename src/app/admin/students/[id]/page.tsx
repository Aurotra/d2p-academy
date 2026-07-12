import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { StudentProfileRecord } from "@/core/domain/student-profile";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseStudentProfileRepository } from "@/infrastructure/repositories/supabase-student-profile-repository";
import { ProfileProgressBar } from "@/presentation/components/profile/profile-progress-bar";
import {
  CODING_EXPERIENCE_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  LIKERT_OPTIONS,
} from "@/shared/constants/profile-options";

export const dynamic = "force-dynamic";

function labelForGender(gender: StudentProfileRecord["gender"]): string {
  if (gender === "male") return "Erkek";
  if (gender === "female") return "Kız";
  if (gender === "prefer_not_to_say") return "Belirtmek istemiyor";
  return "—";
}

function labelForGradeLevel(value: string): string {
  return (
    GRADE_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? (value || "—")
  );
}

function labelForCodingExperience(value: string): string {
  return (
    CODING_EXPERIENCE_OPTIONS.find((option) => option.value === value)?.label ?? (value || "—")
  );
}

function labelForBeklenti(value: number | ""): string {
  if (value === "") return "—";
  return LIKERT_OPTIONS.find((option) => option.value === value)?.label ?? String(value);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

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

  const progressInput = {
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
        student.motivation_data.beklenti === "" ? null : Number(student.motivation_data.beklenti),
    },
    profile_avatar_url: student.profile_avatar_url,
  };

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
                Profil Cevapları
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
      </div>

      <ProfileProgressBar data={progressInput} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Bölüm A — Kişisel Bilgiler</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Ad Soyad" value={student.full_name || "—"} />
            <InfoRow label="Cinsiyet" value={labelForGender(student.gender)} />
            <InfoRow label="Sınıf" value={labelForGradeLevel(student.grade_level)} />
            <InfoRow label="Okul" value={student.school_name || "—"} />
            <InfoRow label="İl / İlçe" value={student.city_district || "—"} />
            <InfoRow
              label="KVKK Onayı"
              value={student.kvkk_accepted ? "Onaylandı" : "Onaylanmadı"}
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Bölüm B — Deneyim</h2>
          <div className="mt-4 grid gap-3">
            <InfoRow
              label="Kodlama Deneyimi"
              value={labelForCodingExperience(student.experience_data.coding_experience)}
            />
            <InfoRow
              label="Proje Sayısı"
              value={
                student.experience_data.proje_sayisi === ""
                  ? "—"
                  : String(student.experience_data.proje_sayisi)
              }
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Bölüm C — İlgi Alanları</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {student.interests.length > 0 ? (
              student.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-dark"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">Henüz ilgi alanı seçilmedi.</p>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Bölüm D — Motivasyon</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hedef</p>
              <p className="mt-1 text-sm leading-6 text-slate-900">
                {student.motivation_data.hedef || "—"}
              </p>
            </div>
            <InfoRow
              label="Beklenti Düzeyi"
              value={labelForBeklenti(student.motivation_data.beklenti)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
