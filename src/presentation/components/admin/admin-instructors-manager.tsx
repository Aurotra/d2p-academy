"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AdminInstructorRecord } from "@/core/domain/admin-instructor";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

interface AdminInstructorsManagerProps {
  initialInstructors: AdminInstructorRecord[];
}

export function AdminInstructorsManager({ initialInstructors }: AdminInstructorsManagerProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/v1/admin/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { fullName: string; email: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen oluşturulamadı.");
      }

      setSuccess(
        `${payload.data?.fullName ?? fullName} için eğitmen hesabı oluşturuldu. Giriş: ${payload.data?.email ?? email}`,
      );
      setFullName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "İşlem başarısız.");
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleActive(instructor: AdminInstructorRecord) {
    setPendingId(instructor.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/admin/instructors/${instructor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !instructor.isActive }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Durum güncellenemedi.");
      }

      router.refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "İşlem başarısız.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-navy-950">Yeni Eğitmen Hesabı</h2>
        <p className="mt-2 text-sm text-slate-600">
          Eğitmen e-posta ve şifre ile <strong>/login</strong> üzerinden giriş yapar; panel adresi{" "}
          <strong>/instructor</strong>. E-posta onayı otomatik tamamlanır.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            label="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Geçici şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="mt-4" disabled={isCreating}>
          {isCreating ? "Oluşturuluyor..." : "Eğitmen Oluştur"}
        </Button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Eğitmen Listesi</h2>
          <p className="mt-1 text-sm text-slate-500">{initialInstructors.length} kayıt</p>
        </div>

        {initialInstructors.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Henüz eğitmen yok. Yukarıdan ilk hesabı oluşturun.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {initialInstructors.map((instructor) => (
              <li
                key={instructor.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{instructor.fullName}</p>
                  <p className="text-sm text-slate-600">{instructor.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Oluşturulma: {formatDate(instructor.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      instructor.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {instructor.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === instructor.id}
                    onClick={() => void toggleActive(instructor)}
                  >
                    {pendingId === instructor.id
                      ? "Kaydediliyor..."
                      : instructor.isActive
                        ? "Pasifleştir"
                        : "Aktifleştir"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
