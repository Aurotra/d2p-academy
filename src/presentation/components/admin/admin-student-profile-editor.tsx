"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import type { StudentProfileData, StudentProfileRecord } from "@/core/domain/student-profile";
import { SupabaseStudentProfileRepository } from "@/infrastructure/repositories/supabase-student-profile-repository";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { ProfileProgressBar } from "@/presentation/components/profile/profile-progress-bar";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import {
  AVATAR_OPTIONS,
  CODING_EXPERIENCE_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  INTEREST_OPTIONS,
  LIKERT_OPTIONS,
} from "@/shared/constants/profile-options";

interface AdminStudentProfileEditorProps {
  student: StudentProfileRecord;
}

function toFormData(student: StudentProfileRecord): StudentProfileData {
  return {
    full_name: student.full_name,
    gender: student.gender,
    grade_level: student.grade_level,
    school_name: student.school_name,
    city_district: student.city_district,
    experience_data: student.experience_data,
    interests: student.interests,
    motivation_data: student.motivation_data,
    profile_avatar_url: student.profile_avatar_url,
    kvkk_accepted: student.kvkk_accepted,
  };
}

export function AdminStudentProfileEditor({ student }: AdminStudentProfileEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<StudentProfileData>(() => toFormData(student));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const progressInput = useMemo(
    () => ({
      full_name: form.full_name,
      gender: form.gender,
      grade_level: form.grade_level,
      school_name: form.school_name,
      city_district: form.city_district,
      experience_data: {
        coding_experience: form.experience_data.coding_experience,
        proje_sayisi:
          form.experience_data.proje_sayisi === ""
            ? null
            : Number(form.experience_data.proje_sayisi),
      },
      interests: form.interests,
      motivation_data: {
        hedef: form.motivation_data.hedef,
        beklenti:
          form.motivation_data.beklenti === "" ? null : Number(form.motivation_data.beklenti),
      },
      profile_avatar_url: form.profile_avatar_url,
    }),
    [form],
  );

  function toggleInterest(interest: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!form.full_name.trim()) {
      setMessage({ type: "error", text: "Ad soyad zorunludur." });
      return;
    }

    if (form.motivation_data.hedef.length > 300) {
      setMessage({ type: "error", text: "Hedef alanı en fazla 300 karakter olabilir." });
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setMessage({ type: "error", text: "Bağlantı kurulamadı." });
      return;
    }

    setIsSaving(true);

    try {
      const repository = new SupabaseStudentProfileRepository(client);
      await repository.updateProfile(student.id, form);
      setMessage({ type: "success", text: "Öğrenci profili güncellendi." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Profil kaydedilemedi.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ProfileProgressBar data={progressInput} />

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">
            Bölüm A — Kişisel Bilgiler
          </legend>
          <div className="mt-4 space-y-4">
            <Input
              label="Ad Soyad"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Cinsiyet</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: "male", label: "Erkek" },
                  { value: "female", label: "Kız" },
                  { value: "prefer_not_to_say", label: "Belirtmek istemiyorum" },
                ].map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="admin-gender"
                      value={option.value}
                      checked={form.gender === option.value}
                      onChange={() =>
                        setForm({
                          ...form,
                          gender: option.value as StudentProfileData["gender"],
                        })
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <Select
              label="Eğitim Düzeyi"
              value={form.grade_level}
              onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
            >
              <option value="">Seçiniz</option>
              {GRADE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Okul Adı"
              value={form.school_name}
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
            />
            <Input
              label="İl / İlçe"
              value={form.city_district}
              onChange={(e) => setForm({ ...form, city_district: e.target.value })}
            />
            <p className="text-xs text-slate-500">E-posta (değiştirilemez): {student.email}</p>
          </div>
        </fieldset>

        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">Bölüm B — Deneyim</legend>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Kodlama Deneyimi</p>
              <div className="flex flex-wrap gap-4">
                {CODING_EXPERIENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="admin-coding"
                      value={option.value}
                      checked={form.experience_data.coding_experience === option.value}
                      onChange={() =>
                        setForm({
                          ...form,
                          experience_data: {
                            ...form.experience_data,
                            coding_experience: option.value,
                          },
                        })
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <Input
              label="Tamamlanan Proje Sayısı (opsiyonel)"
              type="number"
              min={0}
              value={form.experience_data.proje_sayisi}
              onChange={(e) =>
                setForm({
                  ...form,
                  experience_data: {
                    ...form.experience_data,
                    proje_sayisi: e.target.value === "" ? "" : Number(e.target.value),
                  },
                })
              }
            />
            <p className="text-xs text-slate-500">
              Bu alan isteğe bağlıdır; profil tamamlanma yüzdesini etkilemez.
            </p>
          </div>
        </fieldset>

        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">Bölüm C — İlgi Alanları</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((interest) => (
              <label
                key={interest}
                className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                />
                {interest}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">Bölüm D — Motivasyon</legend>
          <div className="mt-4 space-y-4">
            <Textarea
              label="Hedef / beklenti (max 300 karakter)"
              maxLength={300}
              value={form.motivation_data.hedef}
              onChange={(e) =>
                setForm({
                  ...form,
                  motivation_data: { ...form.motivation_data, hedef: e.target.value },
                })
              }
            />
            <p className="text-xs text-slate-500">{form.motivation_data.hedef.length}/300</p>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Beklenti Düzeyi (1-5)</p>
              <div className="space-y-2">
                {LIKERT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="admin-beklenti"
                      value={option.value}
                      checked={form.motivation_data.beklenti === option.value}
                      onChange={() =>
                        setForm({
                          ...form,
                          motivation_data: {
                            ...form.motivation_data,
                            beklenti: option.value,
                          },
                        })
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">Bölüm E — Avatar</legend>
          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium text-slate-900">Avatar</p>
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {AVATAR_OPTIONS.map((avatar) => {
                const selected = form.profile_avatar_url === avatar.src;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setForm({ ...form, profile_avatar_url: avatar.src })}
                    aria-label={avatar.label}
                    aria-pressed={selected}
                    className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition ${
                      selected
                        ? "border-document-primary ring-2 ring-document-primary/30"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <Image
                      src={avatar.src}
                      alt={avatar.label}
                      fill
                      sizes="(max-width: 640px) 25vw, 120px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-lg font-bold text-slate-900">Bölüm F — KVKK</legend>
          <div className="mt-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.kvkk_accepted}
                onChange={(e) => setForm({ ...form, kvkk_accepted: e.target.checked })}
                className="mt-1"
              />
              <span>KVKK onayı alındı</span>
            </label>
          </div>
        </fieldset>

        {message ? (
          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSaving}
          className="bg-document-primary hover:bg-document-primary-hover"
        >
          {isSaving ? "Kaydediliyor..." : "Profili Kaydet"}
        </Button>
      </form>
    </div>
  );
}
