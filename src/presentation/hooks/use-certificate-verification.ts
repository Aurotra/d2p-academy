"use client";

import { useState } from "react";

import type { CertificateVerificationResult } from "@/core/domain/certificate-verification";

interface VerifyCertificateResponse {
  data: CertificateVerificationResult;
}

interface UseCertificateVerificationState {
  verify: (certificateCode: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  result: CertificateVerificationResult | null;
}

export function useCertificateVerification(): UseCertificateVerificationState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);

  async function verify(certificateCode: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/certificates/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ certificateCode }),
      });

      const payload = (await response.json()) as VerifyCertificateResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Doğrulama başarısız oldu.");
      }

      setResult(payload.data);
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : "Beklenmeyen bir hata oluştu.";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    verify,
    isLoading,
    error,
    result,
  };
}
