"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import type { StudentProfileData } from "@/core/domain/student-profile";
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

type AlertState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const emptyProfile: StudentProfileData = {
  full_name: "",
  gender: "",
  grade_level: "",
  school_name: "",
  city_district: "",
  experience_data: { coding_experience: "", proje_sayisi: "" },
  interests: [],
  motivation_data: { hedef: "", beklenti: "" },
  profile_avatar_url: "",
  kvkk_accepted: false,
};

export default function DashboardProfilePage() {
  const router = useRouter();
  const alertRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<StudentProfileData>(emptyProfile);
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    if (!alert) {
      return;
    }

    alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [alert]);

  useEffect(() => {
    async function loadProfile() {
      const client = createSupabaseBrowserClient();
      if (!client) {
        router.replace("/login");
        return;
      }

      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const repository = new SupabaseStudentProfileRepository(client);
      const profile = await repository.getByUserId(user.id);

      if (profile) {
        setForm({
          full_name: profile.full_name,
          gender: profile.gender,
          grade_level: profile.grade_level,
          school_name: profile.school_name,
          city_district: profile.city_district,
          experience_data: profile.experience_data,
          interests: profile.interests,
          motivation_data: profile.motivation_data,
          profile_avatar_url: profile.profile_avatar_url,
          kvkk_accepted: profile.kvkk_accepted,
        });
      }

      setIsLoading(false);
    }

    void loadProfile();
  }, [router]);

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
    setAlert(null);

    if (!form.kvkk_accepted) {
      setAlert({ type: "error", message: "Kayıt için KVKK onayı zorunludur." });
      return;
    }

    if (form.motivation_data.hedef.length > 300) {
      setAlert({ type: "error", message: "Hedef alanı en fazla 300 karakter olabilir." });
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setAlert({ type: "error", message: "Supabase bağlantısı kurulamadı." });
      return;
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setIsSaving(true);

    try {
      const repository = new SupabaseStudentProfileRepository(client);
      await repository.updateProfile(user.id, form);
      setAlert({ type: "success", message: "Profiliniz başarıyla kaydedildi." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Profil kaydedilemedi.";
      setAlert({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Profil yükleniyor...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              Profil Sihirbazı
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Öğrenci Profilim</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-document-primary hover:text-document-primary-hover"
          >
            ← Panele Dön
          </Link>
        </div>

        <ProfileProgressBar data={progressInput} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="px-2 text-lg font-bold text-slate-900">Bölüm A — Kişisel Bilgiler</legend>
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
                        name="gender"
                        value={option.value}
                        checked={form.gender === option.value}
                        onChange={() =>
                          setForm({ ...form, gender: option.value as StudentProfileData["gender"] })
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
                required
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
                        name="coding_experience"
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
                label="Tamamlanan Proje Sayısı"
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
            </div>
          </fieldset>

          <fieldset className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="px-2 text-lg font-bold text-slate-900">Bölüm C — İlgi Alanları</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((interest) => (
                <label key={interest} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm">
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
                label="D2P Academy'den beklentiniz / hedefiniz (max 300 karakter)"
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
                        name="beklenti"
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
            <legend className="px-2 text-lg font-bold text-slate-900">Bölüm E — Avatar & KVKK</legend>
            <div className="mt-4 space-y-4">
              <p className="text-sm font-medium text-slate-900">Avatar Seçimi</p>
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
              <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.kvkk_accepted}
                  onChange={(e) => setForm({ ...form, kvkk_accepted: e.target.checked })}
                  className="mt-1"
                />
                <span>
                  KVKK aydınlatma metnini okudum, kişisel verilerimin D2P Academy tarafından eğitim
                  süreçlerinde işlenmesini kabul ediyorum.
                </span>
              </label>
            </div>
          </fieldset>

          {alert ? (
            <div
              ref={alertRef}
              className={`rounded-2xl border-2 px-5 py-4 text-sm font-medium leading-6 ${
                alert.type === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-800"
              }`}
              role={alert.type === "success" ? "status" : "alert"}
            >
              <p className="font-bold">
                {alert.type === "success" ? "Kaydedildi" : "Kaydedilemedi"}
              </p>
              <p className="mt-1">{alert.message}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document sm:w-auto"
          >
            {isSaving ? "Kaydediliyor..." : "Profili Kaydet"}
          </Button>
        </form>
      </div>
    </section>
  );
}
