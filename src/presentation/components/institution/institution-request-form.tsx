"use client";

import { FormEvent, useState } from "react";

import { KvkkConsentFields } from "@/presentation/components/legal/kvkk-consent-fields";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";

const INSTITUTION_TYPES = [
  "Özel okul",
  "Devlet okulu",
  "Belediye",
  "Dershane / kurs",
  "Diğer",
] as const;

const PACKAGE_OPTIONS = [
  "Sınıf / şube bazlı atölye paketi",
  "Okul içi dönemlik eğitim paketi",
  "Belediye / kurum etkinlik organizasyonu",
  "Öğretmen eğitimi",
  "Diğer / görüşmek istiyorum",
] as const;

const STUDENT_COUNT_OPTIONS = [
  "10–20",
  "21–40",
  "41–80",
  "81–150",
  "150+",
] as const;

const PHONE_PATTERN = /^05\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string): string {
  return value.replace(/\s/g, "");
}

export function InstitutionRequestForm() {
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [packageInterest, setPackageInterest] = useState("");
  const [message, setMessage] = useState("");
  const [kvkkDisclosureAccepted, setKvkkDisclosureAccepted] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [marketingEmailConsent, setMarketingEmailConsent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    const trimmedInstitution = institutionName.trim();
    const trimmedContact = contactName.trim();
    const normalizedPhone = normalizePhone(phone);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCity = city.trim();
    const trimmedMessage = message.trim();

    if (!trimmedInstitution) {
      setFieldError("Kurum adı zorunludur.");
      return;
    }

    if (!institutionType) {
      setFieldError("Kurum türünü seçin.");
      return;
    }

    if (!trimmedContact) {
      setFieldError("Yetkili ad soyad zorunludur.");
      return;
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setFieldError("Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX).");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Geçerli bir e-posta adresi girin.");
      return;
    }

    if (!trimmedCity) {
      setFieldError("İl / ilçe bilgisi zorunludur.");
      return;
    }

    if (!studentCount) {
      setFieldError("Yaklaşık öğrenci / katılımcı sayısını seçin.");
      return;
    }

    if (!packageInterest) {
      setFieldError("İlgilendiğiniz eğitim paketini seçin.");
      return;
    }

    if (!kvkkDisclosureAccepted || !dataProcessingConsent) {
      setFieldError("Zorunlu onay kutularını işaretleyin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/institution-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: trimmedInstitution,
          institutionType,
          contactName: trimmedContact,
          phone: normalizedPhone,
          email: trimmedEmail,
          city: trimmedCity,
          studentCount,
          packageInterest,
          message: trimmedMessage,
          kvkkDisclosureAccepted,
          dataProcessingConsent,
          marketingEmailConsent,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(payload.error ?? "Talep oluşturulamadı.");
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
      );
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
          Talebiniz alındı. Kurumsal ekibimiz en kısa sürede sizinle iletişime geçecek.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Kurum Adı"
        name="institution_name"
        required
        value={institutionName}
        onChange={(event) => setInstitutionName(event.target.value)}
        placeholder="Örn. Denizli Fen Lisesi / Honaz Belediyesi"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Select
        label="Kurum Türü"
        name="institution_type"
        required
        value={institutionType}
        onChange={(event) => setInstitutionType(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {INSTITUTION_TYPES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Input
        label="Yetkili Ad Soyad"
        name="contact_name"
        required
        value={contactName}
        onChange={(event) => setContactName(event.target.value)}
        placeholder="Görüşülecek kişinin adı"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Input
        label="Telefon"
        name="phone"
        type="tel"
        required
        inputMode="numeric"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="05XXXXXXXXX"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Input
        label="E-posta"
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="kurum@ornek.edu.tr"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Input
        label="İl / İlçe"
        name="city"
        required
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Örn. Denizli / Pamukkale"
        className="min-h-[44px] py-3.5 text-base"
      />

      <Select
        label="Yaklaşık Öğrenci / Katılımcı Sayısı"
        name="student_count"
        required
        value={studentCount}
        onChange={(event) => setStudentCount(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {STUDENT_COUNT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option} kişi
          </option>
        ))}
      </Select>

      <Select
        label="İlgilenilen Eğitim Paketi"
        name="package_interest"
        required
        value={packageInterest}
        onChange={(event) => setPackageInterest(event.target.value)}
        className="min-h-[44px] py-3.5 text-base"
      >
        <option value="">Seçiniz</option>
        {PACKAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Textarea
        label="Ek Not (isteğe bağlı)"
        name="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tarih tercihi, sınıf düzeyleri, mekân bilgisi vb."
        className="min-h-[100px] text-base"
      />

      <KvkkConsentFields
        idPrefix="institution"
        kvkkDisclosureAccepted={kvkkDisclosureAccepted}
        dataProcessingConsent={dataProcessingConsent}
        marketingEmailConsent={marketingEmailConsent}
        onKvkkDisclosureChange={setKvkkDisclosureAccepted}
        onDataProcessingChange={setDataProcessingConsent}
        onMarketingEmailChange={setMarketingEmailConsent}
        dataProcessingLabel="Verilerimin eğitim/iletişim süreçlerinde işlenmesine onay veriyorum. Bu formu, temsil ettiğim kurum ve katılımcılar adına, gerekli yasal yetkiye sahip olarak dolduruyorum."
      />

      {fieldError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {fieldError}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {submitError}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting || !kvkkDisclosureAccepted || !dataProcessingConsent}
        className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        {isSubmitting ? "Gönderiliyor..." : "Kurumsal Talep Gönder"}
      </Button>
    </form>
  );
}
