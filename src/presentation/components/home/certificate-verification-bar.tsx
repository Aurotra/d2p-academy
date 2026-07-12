"use client";

import { useState, type FormEvent } from "react";

import { CertificatePreview } from "@/presentation/components/home/certificate-preview";
import { useCertificateVerification } from "@/presentation/hooks/use-certificate-verification";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

export function CertificateVerificationBar() {
  const [certificateCode, setCertificateCode] = useState("");
  const { verify, isLoading, error, result } = useCertificateVerification();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verify(certificateCode);
  }

  return (
    <section id="certificate" className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-sky-200/90 bg-gradient-to-br from-sky-100 via-sky-50 to-accent/25 p-6 shadow-xl shadow-sky-200/40 sm:p-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-dark">
            Sertifika Doğrulama
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Mezuniyet sertifikanızı anında doğrulayın
          </h2>
        </div>

        <div className="mt-8">
          <p className="mx-auto max-w-3xl text-center text-base font-normal leading-7 text-slate-800 sm:text-lg sm:leading-8">
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
            className="border-white/80 bg-white/90 sm:flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-slate-900 hover:bg-accent-dark hover:shadow-glow-accent sm:w-auto sm:min-w-40"
          >
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
          <div className="mt-6">
            <CertificatePreview result={result} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
