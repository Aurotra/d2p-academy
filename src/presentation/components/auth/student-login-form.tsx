"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

export function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { redirectTo?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Giriş başarısız oldu.");
      }

      const redirectTo =
        searchParams.get("redirectTo") ?? payload.data?.redirectTo ?? "/student-dashboard";
      const safeRedirect =
        redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/student-dashboard";

      router.push(safeRedirect);
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
      title="Öğrenci Girişi"
      subtitle="Kullanıcı adın ve şifren ile rozetlerine ve sertifikalarına ulaş."
      footerText="E-posta hesabın mı var?"
      footerHref="/login"
      footerLinkLabel="E-posta ile giriş"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Kullanıcı adı"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="örn: emre84 veya ömer84"
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

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Kullanıcı adını veya şifreni unuttuysan velinden yardım iste.
      </p>

      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-cyan-700">
          Ana sayfaya dön
        </Link>
      </p>
    </AuthShell>
  );
}
