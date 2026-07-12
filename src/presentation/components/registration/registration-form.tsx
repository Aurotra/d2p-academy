"use client";

import { FormEvent, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

const GRADE_OPTIONS = ["5", "6", "7", "8", "9", "10", "11", "12"] as const;
const COURSE_OPTIONS = [
  "3D Kalem",
  "3D Modelleme",
  "3D Tasarım",
  "3D Yazıcı",
  "3D Baskı",
  "Robotik",
] as const;

const PHONE_PATTERN = /^05\d{9}$/;

const DUPLICATE_PHONE_MESSAGE =
  "Bu telefon numarasıyla zaten kayıt oluşturulmuş, en kısa sürede size dönüş yapacağız";

function isDuplicatePhoneError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("registrations_phone_unique")
  );
}

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

export function RegistrationForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [course, setCourse] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    const trimmedName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName) {
      setFieldError("Ad soyad alanı zorunludur.");
      return;
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setFieldError("Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX).");
      return;
    }

    if (!grade) {
      setFieldError("Sınıf düzeyi seçin.");
      return;
    }

    if (!course) {
      setFieldError("İlgilenilen atölyeyi seçin.");
      return;
    }

    const client = createSupabaseBrowserClient();

    if (!client) {
      setSubmitError("Bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await client.from("registrations").insert({
        full_name: trimmedName,
        phone: normalizedPhone,
        grade,
        course,
        status: "yeni",
      });

      if (error) {
        if (isDuplicatePhoneError(error)) {
          setSubmitError(DUPLICATE_PHONE_MESSAGE);
        } else {
          setSubmitError(error.message);
        }
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center"
        role="status"
      >
        <p className="text-base font-semibold text-emerald-800">
          Teşekkürler, size en kısa sürede dönüş yapacağız
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Ad Soyad"
        name="full_name"
        type="text"
        required
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Örn. Ayşe Yılmaz"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Input
        label="Veli Telefonu"
        name="phone"
        type="tel"
        required
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="05XXXXXXXXX"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Select
        label="Sınıf Düzeyi"
        name="grade"
        required
        value={grade}
        onChange={(event) => setGrade(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {GRADE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}. Sınıf
          </option>
        ))}
      </Select>

      <Select
        label="İlgilenilen Atölye"
        name="course"
        required
        value={course}
        onChange={(event) => setCourse(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {COURSE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      {fieldError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {fieldError}
        </div>
      ) : null}

      {submitError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        {isSubmitting ? "Gönderiliyor..." : "Ön Kayıt Gönder"}
      </Button>
    </form>
  );
}
