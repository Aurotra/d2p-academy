"use client";

import { FormEvent, useState } from "react";

import { KvkkConsentFields } from "@/presentation/components/legal/kvkk-consent-fields";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import {
  KAKLIK_CAMPAIGN_NOTE,
  KAKLIK_CAMPAIGN_TITLE,
  KAKLIK_TIME_GROUPS,
} from "@/shared/constants/kaklik-campaign";

const PHONE_PATTERN = /^05\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

export function KaklikCampaignRegistrationForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timeGroup, setTimeGroup] = useState("");
  const [kvkkDisclosureAccepted, setKvkkDisclosureAccepted] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [marketingEmailConsent, setMarketingEmailConsent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const canSubmit = kvkkDisclosureAccepted && dataProcessingConsent;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    if (!trimmedName) {
      setFieldError("Ad soyad alanı zorunludur.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setFieldError("Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX).");
      return;
    }
    if (!timeGroup) {
      setFieldError("Eğitim saati / grup seçimi zorunludur.");
      return;
    }
    if (!kvkkDisclosureAccepted || !dataProcessingConsent) {
      setFieldError("Zorunlu onay kutularını işaretleyin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/registrations/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
          timeGroup,
          kvkkDisclosureAccepted,
          dataProcessingConsent,
          marketingEmailConsent,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıt oluşturulamadı.");
      }

      setIsSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setTimeGroup("");
      setKvkkDisclosureAccepted(false);
      setDataProcessingConsent(false);
      setMarketingEmailConsent(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Kayıt oluşturulamadı.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-6 text-center">
        <p className="text-lg font-black text-emerald-950">Kaydınız alındı!</p>
        <p className="mt-2 text-sm font-medium text-emerald-900">
          {KAKLIK_CAMPAIGN_TITLE} için yerinizi ayırttınız. En kısa sürede sizinle iletişime
          geçeceğiz.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => setIsSuccess(false)}
        >
          Yeni kayıt
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Adı Soyadı"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <Input
        label="Telefon Numarası"
        name="phone"
        type="tel"
        inputMode="numeric"
        placeholder="05XXXXXXXXX"
        autoComplete="tel"
        required
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-navy-950">
          Eğitim Saati / Grup Seçimi <span className="text-rose-600">*</span>
        </legend>
        <div className="grid gap-2">
          {KAKLIK_TIME_GROUPS.map((group) => {
            const selected = timeGroup === group.value;
            return (
              <label
                key={group.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  selected
                    ? "border-document-primary bg-document-primary/10 text-navy-950"
                    : "border-slate-200 bg-white text-slate-800 hover:border-sky-300"
                }`}
              >
                <input
                  type="radio"
                  name="timeGroup"
                  value={group.value}
                  checked={selected}
                  onChange={() => setTimeGroup(group.value)}
                  className="size-4 border-slate-300 text-document-primary"
                  required
                />
                <span>
                  <span className="block font-bold">{group.shortLabel}</span>
                  <span className="text-xs font-medium text-slate-600">{group.hours}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950">
          {KAKLIK_CAMPAIGN_NOTE}
        </p>
      </fieldset>

      <KvkkConsentFields
        idPrefix="kaklik"
        kvkkDisclosureAccepted={kvkkDisclosureAccepted}
        dataProcessingConsent={dataProcessingConsent}
        marketingEmailConsent={marketingEmailConsent}
        onKvkkDisclosureChange={setKvkkDisclosureAccepted}
        onDataProcessingChange={setDataProcessingConsent}
        onMarketingEmailChange={setMarketingEmailConsent}
        dataProcessingLabel="Verilerimin eğitim/iletişim süreçlerinde işlenmesine onay veriyorum."
      />

      {fieldError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fieldError}
        </p>
      ) : null}
      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Gönderiliyor..." : "Hemen Kayıt Ol"}
      </Button>
    </form>
  );
}
