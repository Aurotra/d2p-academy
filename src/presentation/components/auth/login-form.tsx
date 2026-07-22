"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { defaultRedirect?: string };
      };

      if (!response.ok) {
        throw new Error(mapAuthErrorToTurkish(payload.error ?? "Giriş başarısız oldu."));
      }

      const redirectTo =
        searchParams.get("redirectTo") ?? payload.data?.defaultRedirect ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "Beklenmeyen bir hata oluştu.";
      setError(mapAuthErrorToTurkish(message));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Veli Girişi"
      subtitle="Çocuklarınızı yönetmek ve kayıt işlemlerini takip etmek için e-posta ve şifrenizle giriş yapın."
      footerText="Hesabınız yok mu?"
      footerHref="/register"
      footerLinkLabel="Kayıt Ol"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />

        {error ? (
          <div
            className="rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            <p className="font-bold text-red-900">Giriş yapılamadı</p>
            <p className="mt-2">{error}</p>
          </div>
        ) : null}

        <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
          {isLoading ? "Giriş yapılıyor..." : "Veli Girişi"}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-sm text-slate-600">Öğrenci misiniz?</p>
        <AuthPortalLink href="/student-login" kind="student" block>
          Öğrenci Girişi
        </AuthPortalLink>
      </div>

      <p className="mt-3 text-center text-sm">
        <Link href={PARENT_GUIDE_PATH} className="font-semibold text-secondary hover:text-secondary-hover">
          İlk kez mi kayıt oluyorsunuz? Veli kayıt rehberi →
        </Link>
      </p>

      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-cyan-700">
          Ana sayfaya dön
        </Link>
      </p>
    </AuthShell>
  );
}
