"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/presentation/components/auth/auth-shell";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıt başarısız oldu.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (registerError) {
      const message =
        registerError instanceof Error ? registerError.message : "Beklenmeyen bir hata oluştu.";
      setError(message);
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
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
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
