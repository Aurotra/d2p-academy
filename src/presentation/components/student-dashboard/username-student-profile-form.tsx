"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { ProfileProgressInput } from "@/core/domain/student-profile";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { ValueChipGroup } from "@/presentation/components/forms/value-chip-group";
import { ProfileProgressBar } from "@/presentation/components/profile/profile-progress-bar";
import {
  AVATAR_OPTIONS,
  CODING_EXPERIENCE_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  INTEREST_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from "@/shared/constants/profile-options";
import {
  calculateProgress,
  isProfileComplete,
  PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE,
} from "@/lib/utils/progress";
import { ProfileMotivationFields } from "@/presentation/components/profile/profile-motivation-fields";
import {
  isValidTurkishMobilePhone,
  TURKISH_MOBILE_PHONE_ERROR,
} from "@/shared/utils/turkish-phone";

type ProfileForm = {
  full_name: string;
  gender: string;
  grade_level: string;
  school_name: string;
  city_district: string;
  parent_phone: string;
  coding_experience: string;
  proje_sayisi: string;
  interests: string[];
  hedef: string;
  beklenti: string;
  profile_avatar_url: string;
  kvkk_accepted: boolean;
};

const GENDER_OPTIONS = PROFILE_GENDER_OPTIONS;

const emptyForm: ProfileForm = {
  full_name: "",
  gender: "",
  grade_level: "",
  school_name: "",
  city_district: "",
  parent_phone: "",
  coding_experience: "",
  proje_sayisi: "",
  interests: [],
  hedef: "",
  beklenti: "",
  profile_avatar_url: "",
  kvkk_accepted: false,
};

function formToProgressInput(form: ProfileForm, requireParentPhone: boolean): ProfileProgressInput {
  return {
    full_name: form.full_name,
    gender: form.gender,
    grade_level: form.grade_level,
    school_name: form.school_name,
    city_district: form.city_district,
    parent_phone: requireParentPhone ? form.parent_phone : null,
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
  };
}

export function UsernameStudentProfileForm({
  apiPath = "/api/v1/student/profile",
  title = "Profilim",
  backHref = "/student-dashboard",
  backLabel = "Panele dön",
  redirectOnCompleteHref,
  requireCompleteToSave = false,
}: {
  apiPath?: string;
  title?: string;
  backHref?: string;
  backLabel?: string;
  /** Tam profil kaydından sonra yönlendirilecek sayfa (ör. veli akışında etkinlikler). */
  redirectOnCompleteHref?: string;
  /** Veli çocuk profili: %100 olmadan kayda izin verme. */
  requireCompleteToSave?: boolean;
} = {}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const progressOptions = useMemo(
    () => (requireCompleteToSave ? { requireParentPhone: true } : undefined),
    [requireCompleteToSave],
  );
  const liveProgressInput = useMemo(
    () => formToProgressInput(form, Boolean(progressOptions?.requireParentPhone)),
    [form, progressOptions],
  );
  const liveProgress = useMemo(
    () => calculateProgress(liveProgressInput, progressOptions),
    [liveProgressInput, progressOptions],
  );
  const profileComplete = useMemo(
    () => isProfileComplete(liveProgressInput, progressOptions),
    [liveProgressInput, progressOptions],
  );

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(apiPath);
        const payload = (await response.json()) as {
          error?: string;
          data?: {
            profile: Record<string, unknown>;
            progress: number;
            default_parent_phone?: string | null;
          };
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Profil yüklenemedi.");
        }
        const p = payload.data.profile;
        const experience = (p.experience_data ?? {}) as Record<string, unknown>;
        const motivation = (p.motivation_data ?? {}) as Record<string, unknown>;
        const savedParentPhone = String(p.parent_phone ?? "").trim();
        const defaultParentPhone = String(payload.data.default_parent_phone ?? "").trim();
        setForm({
          full_name: String(p.full_name ?? ""),
          gender: String(p.gender ?? ""),
          grade_level: String(p.grade_level ?? ""),
          school_name: String(p.school_name ?? ""),
          city_district: String(p.city_district ?? ""),
          parent_phone: savedParentPhone || defaultParentPhone,
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
    setError(null);
    setSuccess(null);

    if (requireCompleteToSave && !profileComplete) {
      setError(PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE);
      return;
    }

    if (requireCompleteToSave && !isValidTurkishMobilePhone(form.parent_phone)) {
      setError(TURKISH_MOBILE_PHONE_ERROR);
      return;
    }

    setSaving(true);

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
          parent_phone: requireCompleteToSave ? form.parent_phone : undefined,
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

      const nextProgress = calculateProgress(liveProgressInput, progressOptions);
      setProgress(nextProgress);

      if (profileComplete && redirectOnCompleteHref) {
        router.push(redirectOnCompleteHref);
        return;
      }

      setSuccess(
        profileComplete
          ? "Profil kaydedildi."
          : `Profil kaydedildi. Etkinliklere geçmek için profilin %100 dolu olmalı (şu an %${nextProgress}).`,
      );
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
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            profileComplete
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          %{requireCompleteToSave ? liveProgress : progress}
        </span>
      </div>

      {requireCompleteToSave ? (
        <div className="space-y-3">
          <ProfileProgressBar data={liveProgressInput} options={progressOptions} />
          {!profileComplete ? (
            <div
              className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950"
              role="alert"
            >
              <p className="font-bold text-amber-900">Profil %100 tamamlanmalı</p>
              <p className="mt-2">{PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE}</p>
              <p className="mt-2 text-xs text-amber-800">
                Eksik alanları doldurduğunuzda yüzde otomatik güncellenir. Tamamlanmadan
                kaydedemezsiniz.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Profil tamam. Kaydettiğinizde etkinliklere kayıt adımına geçebilirsiniz.
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Sertifika için profilin %100 dolu olmalı.{" "}
          <Link href={backHref} className="font-semibold text-document-primary underline">
            {backLabel}
          </Link>
        </p>
      )}

      <Input
        label="Ad Soyad"
        value={form.full_name}
        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        required
      />
      <ValueChipGroup
        label="Cinsiyet"
        options={GENDER_OPTIONS}
        value={form.gender}
        onChange={(value) => setForm((f) => ({ ...f, gender: value }))}
      />
      <ValueChipGroup
        label="Sınıf"
        options={GRADE_LEVEL_OPTIONS}
        value={form.grade_level}
        onChange={(value) => setForm((f) => ({ ...f, grade_level: value }))}
      />
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
      {requireCompleteToSave ? (
        <Input
          label="Veli Telefon Numarası"
          type="tel"
          autoComplete="tel"
          placeholder="05XX XXX XX XX veya +90 5XX XXX XX XX"
          value={form.parent_phone}
          onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
          required
        />
      ) : null}
      <ValueChipGroup
        label="Kodlama deneyimi"
        options={CODING_EXPERIENCE_OPTIONS}
        value={form.coding_experience}
        onChange={(value) => setForm((f) => ({ ...f, coding_experience: value }))}
      />
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
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-navy-900">Motivasyon</legend>
        <ProfileMotivationFields
          hedef={form.hedef}
          beklenti={form.beklenti === "" ? "" : Number(form.beklenti)}
          onHedefChange={(value) => setForm((f) => ({ ...f, hedef: value }))}
          onBeklentiChange={(value) => setForm((f) => ({ ...f, beklenti: String(value) }))}
        />
      </fieldset>

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

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button
        type="submit"
        disabled={saving || (requireCompleteToSave && !profileComplete)}
      >
        {saving
          ? "Kaydediliyor..."
          : requireCompleteToSave && !profileComplete
            ? "Profili %100 tamamlayın"
            : "Kaydet"}
      </Button>
    </form>
  );
}
