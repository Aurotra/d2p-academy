"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

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
import { calculateProgress } from "@/lib/utils/progress";

type ProfileForm = {
  full_name: string;
  gender: string;
  grade_level: string;
  school_name: string;
  city_district: string;
  coding_experience: string;
  proje_sayisi: string;
  interests: string[];
  hedef: string;
  beklenti: string;
  profile_avatar_url: string;
  kvkk_accepted: boolean;
};

const emptyForm: ProfileForm = {
  full_name: "",
  gender: "",
  grade_level: "",
  school_name: "",
  city_district: "",
  coding_experience: "",
  proje_sayisi: "",
  interests: [],
  hedef: "",
  beklenti: "",
  profile_avatar_url: "",
  kvkk_accepted: false,
};

export function UsernameStudentProfileForm({
  apiPath = "/api/v1/student/profile",
  title = "Profilim",
  backHref = "/student-dashboard",
  backLabel = "Panele dön",
}: {
  apiPath?: string;
  title?: string;
  backHref?: string;
  backLabel?: string;
} = {}) {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(apiPath);
        const payload = (await response.json()) as {
          error?: string;
          data?: { profile: Record<string, unknown>; progress: number };
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Profil yüklenemedi.");
        }
        const p = payload.data.profile;
        const experience = (p.experience_data ?? {}) as Record<string, unknown>;
        const motivation = (p.motivation_data ?? {}) as Record<string, unknown>;
        setForm({
          full_name: String(p.full_name ?? ""),
          gender: String(p.gender ?? ""),
          grade_level: String(p.grade_level ?? ""),
          school_name: String(p.school_name ?? ""),
          city_district: String(p.city_district ?? ""),
          coding_experience: String(experience.coding_experience ?? ""),
          proje_sayisi:
            experience.proje_sayisi === null || experience.proje_sayisi === undefined
              ? ""
              : String(experience.proje_sayisi),
          interests: Array.isArray(p.interests) ? (p.interests as string[]) : [],
          hedef: String(motivation.hedef ?? ""),
          beklenti:
            motivation.beklenti === null || motivation.beklenti === undefined
              ? ""
              : String(motivation.beklenti),
          profile_avatar_url: String(p.profile_avatar_url ?? ""),
          kvkk_accepted: Boolean(p.kvkk_accepted),
        });
        setProgress(payload.data.progress);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
      } finally {
        setLoading(false);
      }
    })();
  }, [apiPath]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          gender: form.gender,
          grade_level: form.grade_level,
          school_name: form.school_name,
          city_district: form.city_district,
          experience_data: {
            coding_experience: form.coding_experience || null,
            proje_sayisi: form.proje_sayisi === "" ? null : Number(form.proje_sayisi),
          },
          interests: form.interests,
          motivation_data: {
            hedef: form.hedef,
            beklenti: form.beklenti === "" ? null : Number(form.beklenti),
          },
          profile_avatar_url: form.profile_avatar_url || null,
          kvkk_accepted: form.kvkk_accepted,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { profile: Record<string, unknown> };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıt başarısız.");
      }

      const nextProgress = calculateProgress({
        full_name: form.full_name,
        gender: form.gender,
        grade_level: form.grade_level,
        school_name: form.school_name,
        city_district: form.city_district,
        experience_data: {
          coding_experience: form.coding_experience,
          proje_sayisi: form.proje_sayisi === "" ? null : Number(form.proje_sayisi),
        },
        interests: form.interests,
        motivation_data: {
          hedef: form.hedef,
          beklenti: form.beklenti === "" ? null : Number(form.beklenti),
        },
        profile_avatar_url: form.profile_avatar_url || null,
      });
      setProgress(nextProgress);
      setSuccess("Profil kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt hatası.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Profil yükleniyor...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy-950">{title}</h2>
        <span className="rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
          %{progress}
        </span>
      </div>
      <p className="text-sm text-slate-600">
        Sertifika için profilin %100 dolu olmalı.{" "}
        <Link href={backHref} className="font-semibold text-document-primary underline">
          {backLabel}
        </Link>
      </p>

      <Input
        label="Ad Soyad"
        value={form.full_name}
        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        required
      />
      <Select
        label="Cinsiyet"
        value={form.gender}
        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
      >
        <option value="">Seçiniz</option>
        <option value="male">Erkek</option>
        <option value="female">Kız</option>
        <option value="prefer_not_to_say">Belirtmek istemiyorum</option>
      </Select>
      <Select
        label="Sınıf"
        value={form.grade_level}
        onChange={(e) => setForm((f) => ({ ...f, grade_level: e.target.value }))}
      >
        <option value="">Seçiniz</option>
        {GRADE_LEVEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        label="Okul"
        value={form.school_name}
        onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))}
      />
      <Input
        label="İl / İlçe"
        value={form.city_district}
        onChange={(e) => setForm((f) => ({ ...f, city_district: e.target.value }))}
      />
      <Select
        label="Kodlama deneyimi"
        value={form.coding_experience}
        onChange={(e) => setForm((f) => ({ ...f, coding_experience: e.target.value }))}
      >
        <option value="">Seçiniz</option>
        {CODING_EXPERIENCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        label="Tamamlanan proje sayısı (opsiyonel)"
        value={form.proje_sayisi}
        onChange={(e) => setForm((f) => ({ ...f, proje_sayisi: e.target.value }))}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-navy-900">İlgi alanları</legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = form.interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    interests: selected
                      ? f.interests.filter((i) => i !== interest)
                      : [...f.interests, interest],
                  }))
                }
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  selected
                    ? "bg-document-primary text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Textarea
        label="Hedefin"
        value={form.hedef}
        onChange={(e) => setForm((f) => ({ ...f, hedef: e.target.value }))}
      />
      <Select
        label="Beklenti"
        value={form.beklenti}
        onChange={(e) => setForm((f) => ({ ...f, beklenti: e.target.value }))}
      >
        <option value="">Seçiniz</option>
        {LIKERT_OPTIONS.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </Select>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-navy-900">Avatar</legend>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = form.profile_avatar_url === avatar.src;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, profile_avatar_url: avatar.src }))}
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
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.kvkk_accepted}
          onChange={(e) => setForm((f) => ({ ...f, kvkk_accepted: e.target.checked }))}
          className="mt-1"
        />
        KVKK metnini okudum ve kabul ediyorum.
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
