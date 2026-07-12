"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import {
  EMAIL_CONFIRMATION_NOTICE,
  mapAuthErrorToTurkish,
} from "@/shared/utils/auth-errors";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { needsEmailConfirmation?: boolean };
      };

      if (!response.ok) {
        throw new Error(mapAuthErrorToTurkish(payload.error ?? "Kayıt başarısız oldu."));
      }

      if (payload.data?.needsEmailConfirmation) {
        setSuccessNotice(EMAIL_CONFIRMATION_NOTICE);
        setPassword("");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (registerError) {
      const message =
        registerError instanceof Error ? registerError.message : "Beklenmeyen bir hata oluştu.";
      setError(mapAuthErrorToTurkish(message));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Kayıt Ol"
      subtitle="D2P Academy öğrenci hesabınızı birkaç adımda oluşturun."
      footerText="Zaten hesabınız var mı?"
      footerHref="/login"
      footerLinkLabel="Giriş Yap"
    >
      {successNotice ? (
        <div
          className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-5 text-sm leading-6 text-amber-950"
          role="status"
        >
          <p className="text-base font-bold text-amber-900">E-posta onayını bekliyoruz</p>
          <p className="mt-2">{successNotice}</p>
          <p className="mt-4">
            <Link href="/login" className="font-semibold text-document-primary underline">
              Onayladıktan sonra giriş yapın →
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Soyad"
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Adınız Soyadınız"
            required
          />
          <Input
            label="E-posta"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@okul.com"
            required
          />
          <Input
            label="Şifre"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 6 karakter"
            minLength={6}
            required
          />

          {error ? (
            <div
              className="rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
              role="alert"
            >
              <p className="font-bold text-red-900">Kayıt tamamlanamadı</p>
              <p className="mt-2">{error}</p>
            </div>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-cyan-700">
          Ana sayfaya dön
        </Link>
      </p>
    </AuthShell>
  );
}
