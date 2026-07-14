"use client";

import { useEffect, useState } from "react";

import type { CertificateVerificationResult } from "@/core/domain/certificate-verification";
import { CertificatePreview } from "@/presentation/components/home/certificate-preview";

interface VerifyCertificatePageProps {
  code: string;
}

export function CertificateVerifyByCode({ code }: VerifyCertificatePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/certificates/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateCode: code }),
        });

        const payload = (await response.json()) as
          | { data: CertificateVerificationResult }
          | { error: string };

        if (!response.ok || "error" in payload) {
          throw new Error("error" in payload ? payload.error : "Doğrulama başarısız oldu.");
        }

        if (!cancelled) {
          setResult({
            ...payload.data,
            issuedAt: payload.data.issuedAt ? new Date(payload.data.issuedAt) : null,
          });
        }
      } catch (verifyError) {
        if (!cancelled) {
          setError(verifyError instanceof Error ? verifyError.message : "Beklenmeyen bir hata oluştu.");
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-sky-200/90 bg-gradient-to-br from-sky-100 via-sky-50 to-accent/25 p-6 shadow-xl shadow-sky-200/40 sm:p-8">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-accent-dark">
          Sertifika Doğrulama
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Sertifika sorgusu
        </h1>
        <p className="mt-3 text-center font-mono text-sm font-semibold text-slate-700">{code}</p>

        {isLoading ? (
          <p className="mt-6 text-center text-sm text-slate-600">Doğrulanıyor...</p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-6">
            <CertificatePreview result={result} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
