"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { mapAuthErrorToTurkish } from "@/shared/utils/auth-errors";

export function InstructorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInAs, setLoggedInAs] = useState<string | null>(null);

  useEffect(() => {
    async function probeSession() {
      const client = createSupabaseBrowserClient();
      if (!client) {
        return;
      }

      const { data } = await client.auth.getUser();
      if (!data.user) {
        setLoggedInAs(null);
        return;
      }

      const { data: profile } = await client
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role === "instructor") {
        const redirectTo = searchParams.get("redirectTo");
        const safeRedirect =
          redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/instructor";
        router.replace(safeRedirect);
        return;
      }

      setLoggedInAs(profile?.full_name ?? data.user.email ?? "Başka hesap");
    }

    void probeSession();
  }, [router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (loggedInAs) {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        setLoggedInAs(null);
      }

      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { role?: string; defaultRedirect?: string };
      };

      if (!response.ok) {
        throw new Error(mapAuthErrorToTurkish(payload.error ?? "Giriş başarısız oldu."));
      }

      if (payload.data?.role !== "instructor") {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        throw new Error("Bu hesap eğitmen yetkisine sahip değil. Veli girişini kullanın.");
      }

      const redirectTo = searchParams.get("redirectTo") ?? "/instructor";
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
      title="Eğitmen Girişi"
      subtitle="Size atanmış etkinliklerde yoklama almak için e-posta ve şifrenizle giriş yapın."
      footerText="Veli misiniz?"
      footerHref="/login"
      footerLinkLabel="Veli Girişi"
      footerLinkKind="parent"
    >
      {loggedInAs ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Şu an <strong>{loggedInAs}</strong> olarak giriş yapılmış. Eğitmen hesabıyla devam etmek
          için aşağıdan tekrar giriş yapın; önceki oturum kapatılır.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-posta"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="egitmen@d2p.com.tr"
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
          {isLoading ? "Giriş yapılıyor..." : "Eğitmen Girişi"}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-center">
        <p className="text-sm text-slate-600">Başka giriş seçenekleri</p>
        <AuthPortalLink href="/student-login" kind="student" block>
          Öğrenci Girişi
        </AuthPortalLink>
      </div>

      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-slate-500 transition hover:text-cyan-700">
          Ana sayfaya dön
        </Link>
      </p>
    </AuthShell>
  );
}
