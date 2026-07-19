"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import {
  RegistrationStatusSelector,
  type RegistrationStatus,
} from "@/presentation/components/admin/registration-status-selector";
import { Button } from "@/presentation/components/ui/button";
import {
  GRADE_LEVEL_OPTIONS,
  REGISTRATION_COURSE_OPTIONS,
} from "@/shared/constants/profile-options";
import { formatKaklikTimeGroup } from "@/shared/constants/kaklik-campaign";

const PHONE_PATTERN = /^05\d{9}$/;

export interface AdminRegistrationRow {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  grade: string;
  course: string;
  status: RegistrationStatus;
  created_at: string;
  is_minor?: boolean;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  campaign?: string | null;
  time_group?: string | null;
}

interface RegistrationEditableRowProps {
  registration: AdminRegistrationRow;
  formattedDate: string;
}

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

function formatGrade(grade: string): string {
  const match = GRADE_LEVEL_OPTIONS.find((option) => option.value === grade);
  if (match) return match.label;
  if (/^\d+$/.test(grade)) return `${grade}. Sınıf`;
  return grade;
}

export function RegistrationEditableRow({
  registration,
  formattedDate,
}: RegistrationEditableRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(registration.full_name);
  const [phone, setPhone] = useState(registration.phone);
  const [grade, setGrade] = useState(registration.grade);
  const [course, setCourse] = useState(registration.course);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setFullName(registration.full_name);
    setPhone(registration.phone);
    setGrade(registration.grade);
    setCourse(registration.course);
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmedName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName) {
      setError("Ad soyad boş olamaz.");
      return;
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setError("Telefon 05XXXXXXXXX formatında olmalı.");
      return;
    }

    if (!grade || !course) {
      setError("Eğitim düzeyi ve atölye seçilmeli.");
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Bağlantı kurulamadı.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await client
        .from("registrations")
        .update({
          full_name: trimmedName,
          phone: normalizedPhone,
          grade,
          course,
        })
        .eq("id", registration.id);

      if (updateError) {
        const message = updateError.message.toLowerCase();
        if (
          updateError.code === "23505" ||
          message.includes("duplicate") ||
          message.includes("registrations_phone_unique")
        ) {
          setError("Bu telefon numarası başka bir kayıtta kullanılıyor.");
        } else {
          setError(updateError.message);
        }
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kayıt güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <tr className="border-b border-sky-100 bg-sky-50/40 last:border-0">
        <td className="px-5 py-4" colSpan={6}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ad Soyad
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Telefon
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Eğitim Düzeyi
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {GRADE_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                {!GRADE_LEVEL_OPTIONS.some((option) => option.value === grade) ? (
                  <option value={grade}>{grade}</option>
                ) : null}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Atölye
              <select
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {REGISTRATION_COURSE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                {!REGISTRATION_COURSE_OPTIONS.includes(
                  course as (typeof REGISTRATION_COURSE_OPTIONS)[number],
                ) ? (
                  <option value={course}>{course}</option>
                ) : null}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={resetForm}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              İptal
            </Button>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-5 py-4 font-semibold text-slate-900">
        {registration.full_name}
        {registration.is_minor ? (
          <p className="mt-1 text-xs font-normal text-amber-800">
            18 yaş altı
            {registration.guardian_name ? ` · Veli: ${registration.guardian_name}` : ""}
            {registration.guardian_phone ? ` (${registration.guardian_phone})` : ""}
          </p>
        ) : null}
        {registration.email ? (
          <p className="mt-1 text-xs font-normal text-slate-500">{registration.email}</p>
        ) : null}
      </td>
      <td className="px-5 py-4 text-slate-700">{registration.phone}</td>
      <td className="px-5 py-4 text-slate-700">
        {registration.time_group ? (
          <span className="inline-flex rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-900">
            {formatKaklikTimeGroup(registration.time_group)}
          </span>
        ) : (
          formatGrade(registration.grade)
        )}
      </td>
      <td className="px-5 py-4 text-slate-700">{registration.course}</td>
      <td className="px-5 py-4">
        <RegistrationStatusSelector
          registrationId={registration.id}
          initialStatus={registration.status}
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-2">
          <span className="text-slate-600">{formattedDate}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="min-h-[36px] w-fit px-3 py-1.5 text-xs"
          >
            Düzenle
          </Button>
        </div>
      </td>
    </tr>
  );
}
