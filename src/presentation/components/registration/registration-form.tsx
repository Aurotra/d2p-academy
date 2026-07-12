"use client";

import { FormEvent, useMemo, useState } from "react";

import { KvkkConsentFields } from "@/presentation/components/legal/kvkk-consent-fields";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { GRADE_LEVEL_OPTIONS, REGISTRATION_COURSE_OPTIONS } from "@/shared/constants/profile-options";

const PHONE_PATTERN = /^05\d{9}$/;

const DUPLICATE_PHONE_MESSAGE =
  "Bu telefon numarasıyla zaten kayıt oluşturulmuş, en kısa sürede size dönüş yapacağız";

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

export function RegistrationForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [course, setCourse] = useState("");
  const [isMinor, setIsMinor] = useState<boolean | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [kvkkDisclosureAccepted, setKvkkDisclosureAccepted] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [marketingEmailConsent, setMarketingEmailConsent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const dataProcessingLabel = useMemo(() => {
    if (isMinor) {
      return "Veli/Vasi sıfatıyla, katılımcının kişisel verilerinin işlenmesine ve Aydınlatma Metni'ni okuduğuma dair açık rızamı veriyorum.";
    }
    return "Verilerimin eğitim/iletişim süreçlerinde işlenmesine onay veriyorum.";
  }, [isMinor]);

  const canSubmit =
    kvkkDisclosureAccepted &&
    dataProcessingConsent &&
    isMinor !== null &&
    (!isMinor || (guardianName.trim() !== "" && PHONE_PATTERN.test(normalizePhone(guardianPhone))));

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
      setFieldError("Eğitim düzeyini seçin.");
      return;
    }

    if (!course) {
      setFieldError("İlgilenilen atölyeyi seçin.");
      return;
    }

    if (isMinor === null) {
      setFieldError("Katılımcının 18 yaşından küçük olup olmadığını belirtin.");
      return;
    }

    if (isMinor) {
      if (!guardianName.trim()) {
        setFieldError("Veli/vasi ad soyad zorunludur.");
        return;
      }
      if (!PHONE_PATTERN.test(normalizePhone(guardianPhone))) {
        setFieldError("Veli/vasi telefonu geçerli formatta olmalıdır (05XXXXXXXXX).");
        return;
      }
    }

    if (!kvkkDisclosureAccepted || !dataProcessingConsent) {
      setFieldError("Zorunlu onay kutularını işaretleyin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          phone: normalizedPhone,
          grade,
          course,
          isMinor,
          guardianName: isMinor ? guardianName.trim() : undefined,
          guardianPhone: isMinor ? normalizePhone(guardianPhone) : undefined,
          kvkkDisclosureAccepted,
          dataProcessingConsent,
          marketingEmailConsent,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(payload.error ?? "Kayıt oluşturulamadı.");
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
        label="Telefon"
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
        label="Eğitim Düzeyi"
        name="grade"
        required
        value={grade}
        onChange={(event) => setGrade(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {GRADE_LEVEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
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
        {REGISTRATION_COURSE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Katılımcı 18 yaşından küçük mü?
        </legend>
        <div className="flex flex-wrap gap-4">
          <label htmlFor="is-minor-yes" className="inline-flex items-center gap-2 text-sm">
            <input
              id="is-minor-yes"
              name="is_minor"
              type="radio"
              value="yes"
              required
              checked={isMinor === true}
              onChange={() => setIsMinor(true)}
            />
            Evet
          </label>
          <label htmlFor="is-minor-no" className="inline-flex items-center gap-2 text-sm">
            <input
              id="is-minor-no"
              name="is_minor"
              type="radio"
              value="no"
              required
              checked={isMinor === false}
              onChange={() => setIsMinor(false)}
            />
            Hayır
          </label>
        </div>
      </fieldset>

      {isMinor ? (
        <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-950">Veli / Vasi Bilgileri</p>
          <Input
            label="Veli/Vasi Ad Soyad"
            name="guardian_name"
            required
            value={guardianName}
            onChange={(event) => setGuardianName(event.target.value)}
            placeholder="Veli veya vasi adı"
            className="min-h-[44px] py-3.5 text-base"
          />
          <Input
            label="Veli/Vasi Telefon"
            name="guardian_phone"
            type="tel"
            required
            inputMode="numeric"
            value={guardianPhone}
            onChange={(event) => setGuardianPhone(event.target.value)}
            placeholder="05XXXXXXXXX"
            className="min-h-[44px] py-3.5 text-base"
          />
        </div>
      ) : null}

      <KvkkConsentFields
        idPrefix="registration"
        kvkkDisclosureAccepted={kvkkDisclosureAccepted}
        dataProcessingConsent={dataProcessingConsent}
        marketingEmailConsent={marketingEmailConsent}
        onKvkkDisclosureChange={setKvkkDisclosureAccepted}
        onDataProcessingChange={setDataProcessingConsent}
        onMarketingEmailChange={setMarketingEmailConsent}
        dataProcessingLabel={dataProcessingLabel}
      />

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
        disabled={isSubmitting || !canSubmit}
        className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        {isSubmitting ? "Gönderiliyor..." : "Ön Kayıt Gönder"}
      </Button>
    </form>
  );
}
