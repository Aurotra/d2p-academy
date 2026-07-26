"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { sanitizeAuthNextPath } from "@/shared/utils/auth-redirect";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

export function EmailConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const nextPath = sanitizeAuthNextPath(searchParams.get("next"));
  const loginHref = `/login?redirectTo=${encodeURIComponent(nextPath)}`;

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const hasValidParams = Boolean(tokenHash && type);

  async function handleConfirm() {
    if (!hasValidParams) {
      setError("Onay bağlantısı geçersiz veya eksik. Lütfen e-postanızdaki bağlantıyı tekrar kullanın.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/confirm-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenHash,
          type,
          next: nextPath,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { redirectTo?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "E-posta onayı tamamlanamadı.");
      }

      setIsConfirmed(true);
      const redirectTo = payload.data?.redirectTo ?? nextPath;
      router.push(redirectTo);
      router.refresh();
    } catch (confirmError) {
      const message =
        confirmError instanceof Error ? confirmError.message : "E-posta onayı tamamlanamadı.";
      setError(mapAuthErrorToTurkish(message));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="E-posta Onayı"
      subtitle="Hesabınızı etkinleştirmek için aşağıdaki butona tıklayın."
      footerText="Zaten onayladınız mı?"
      footerHref={loginHref}
      footerLinkLabel="Veli Girişi"
      footerLinkKind="parent"
    >
      {!hasValidParams ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Onay bağlantısı geçersiz veya eksik. E-postanızdaki butona tıklayın; sorun sürerse kayıt
            sayfasından aynı e-posta ile tekrar kayıt olun.
          </p>
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover"
          >
            Kayıt Ol
          </Link>
        </div>
      ) : isConfirmed ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          E-postanız onaylandı. Yönlendiriliyorsunuz…
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            E-postanızı onaylamak için «E-postamı Onayla» butonuna basın.
          </p>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <Button className="w-full" disabled={isLoading} onClick={() => void handleConfirm()}>
            {isLoading ? "Onaylanıyor…" : "E-postamı Onayla"}
          </Button>

          <p className="text-center text-xs text-slate-500">
            <Link href={PARENT_GUIDE_PATH} className="font-semibold text-sky-700 hover:underline">
              Veli kayıt rehberi
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
