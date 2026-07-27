"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { GuestOnly } from "@/presentation/components/auth/guest-only";
import { Button } from "@/presentation/components/ui/button";
import { useSiteAuth } from "@/presentation/providers/site-auth-provider";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";
import { sanitizeAuthNextPath } from "@/shared/utils/auth-redirect";
import { isEmailConfirmationExpiredNotice, mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

function PanelLink({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex w-full items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover ${className}`}
    >
      Panele Git
    </Link>
  );
}

export function EmailConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthResolved, isLoggedIn, panelHref } = useSiteAuth();
  const tokenHash = searchParams.get("token_hash")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const nextPath = sanitizeAuthNextPath(searchParams.get("next"));
  const loginHref = `/login?redirectTo=${encodeURIComponent(nextPath)}`;

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const hasValidParams = Boolean(tokenHash && type);
  const showLoggedInState = isAuthResolved && isLoggedIn;

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
      subtitle="Kaydınızı tamamlamak için e-posta onayınızı yapmanız yeterli."
      footerText={showLoggedInState ? "Hesabınız zaten aktif görünüyor." : "Zaten onayladınız mı?"}
      footerHref={showLoggedInState ? panelHref : loginHref}
      footerLinkLabel={showLoggedInState ? "Panele Git" : "Veli Girişi"}
      footerLinkKind={showLoggedInState ? undefined : "parent"}
    >
      {!hasValidParams ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Onay bağlantısı geçersiz veya eksik. E-postanızdaki butona tıklayın; sorun sürerse kayıt
            sayfasından aynı e-posta ile tekrar kayıt olun.
          </p>
          {showLoggedInState ? (
            <PanelLink href={panelHref} />
          ) : (
            <GuestOnly>
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover"
              >
                Kayıt Ol
              </Link>
            </GuestOnly>
          )}
        </div>
      ) : isConfirmed ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          E-postanız onaylandı. Yönlendiriliyorsunuz…
        </p>
      ) : showLoggedInState ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Oturumunuz açık görünüyor. Onayınızı tamamladıysanız doğrudan panele devam edebilirsiniz.
          </p>
          <PanelLink href={panelHref} />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            E-posta adresinizi onaylamak için aşağıdaki butona tıklayabilirsiniz.
          </p>

          {error ? (
            isEmailConfirmationExpiredNotice(error) ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
                <p className="font-semibold text-navy-950">Bu bağlantı artık geçerli değil</p>
                <p className="mt-2 leading-relaxed text-slate-700">{error}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={loginHref}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                  >
                    Veli Girişi
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-50"
                  >
                    Yeni onay maili
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )
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
