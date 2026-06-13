"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

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

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Giriş başarısız oldu.");
      }

      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "Beklenmeyen bir hata oluştu.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Giriş Yap"
      subtitle="Öğrenci panelinize erişmek için hesabınıza giriş yapın."
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-cyan-700">
          Ana sayfaya dön
        </Link>
      </p>
    </AuthShell>
  );
}
