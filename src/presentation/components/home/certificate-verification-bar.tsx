"use client";

import { useState, type FormEvent } from "react";

import type { CertificateVerificationResult } from "@/core/domain/certificate-verification";
import { useCertificateVerification } from "@/presentation/hooks/use-certificate-verification";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

function VerificationResultCard({ result }: { result: CertificateVerificationResult }) {
  if (!result.isValid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">Sertifika bulunamadı veya geçersiz.</p>
        <p className="mt-1">
          Lütfen kodu kontrol edin. Örnek format: <strong>D2P-2026-1045</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p className="font-semibold text-emerald-700">Sertifika doğrulandı</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-700/70">Kod</dt>
          <dd className="font-semibold">{result.certificateCode}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-700/70">Öğrenci</dt>
          <dd className="font-semibold">{result.holderName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-700/70">Eğitim</dt>
          <dd className="font-semibold">{result.eventTitle}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-700/70">Veriliş Tarihi</dt>
          <dd className="font-semibold">
            {result.issuedAt
              ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(result.issuedAt)
              : "-"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function CertificateVerificationBar() {
  const [certificateCode, setCertificateCode] = useState("");
  const { verify, isLoading, error, result } = useCertificateVerification();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verify(certificateCode);
  }

  return (
    <section id="certificate" className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-cyan-200/60 bg-white p-6 shadow-2xl shadow-navy-950/10 sm:p-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Sertifika Doğrulama
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy-950 sm:text-3xl">
            Mezuniyet sertifikanızı anında doğrulayın
          </h2>
        </div>

        <div className="mt-8">
          <p className="mx-auto max-w-3xl text-center text-base font-normal leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Sertifikalarımız, dijital dünyada benzersiz ve doğrulanabilir bir mühendislik
            yetkinliğinin anahtarıdır. Sertifika kodunuzu girerek eğitimin geçerliliğini ve başarı
            detaylarını saniyeler içinde görüntüleyebilirsiniz.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start"
          >
          <Input
            name="certificateCode"
            value={certificateCode}
            onChange={(event) => setCertificateCode(event.target.value)}
            placeholder="D2P-2026-1045"
            aria-label="Sertifika kodu"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto sm:min-w-40">
            {isLoading ? "Doğrulanıyor..." : "Doğrula"}
          </Button>
          </form>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-4">
            <VerificationResultCard result={result} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
