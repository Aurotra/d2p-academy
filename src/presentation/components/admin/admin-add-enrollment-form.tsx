"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

interface AdminAddEnrollmentFormProps {
  eventId: string;
  eventTitle: string;
}

export function AdminAddEnrollmentForm({ eventId, eventTitle }: AdminAddEnrollmentFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, query: query.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { student?: { full_name?: string } };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıt eklenemedi.");
      }

      const name = payload.data?.student?.full_name ?? query;
      setSuccess(`${name} etkinliğe eklendi.`);
      setQuery("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "İşlem başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] border border-sky-200 bg-sky-50/60 p-4 sm:p-5"
    >
      <p className="text-sm font-semibold text-navy-950">Öğrenci ekle — {eventTitle}</p>
      <p className="mt-1 text-xs text-slate-600">
        Kullanıcı adı (e-postasız çocuk) veya e-posta adresi ile ekleyin.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Kullanıcı adı veya e-posta"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ayse_2015 veya ogrenci@okul.com"
            required
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !query.trim()}>
          {isSubmitting ? "Ekleniyor..." : "Kaydet"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
