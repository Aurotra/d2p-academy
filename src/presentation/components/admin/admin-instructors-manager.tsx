"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminInstructorRecord } from "@/core/domain/admin-instructor";
import { Button } from "@/presentation/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleActive(instructor: AdminInstructorRecord) {
    setPendingId(instructor.id);
    setError(null);

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

  async function revokeInstructorRole(instructor: AdminInstructorRecord) {
    if (
      !window.confirm(
        `${instructor.fullName} için eğitmen yetkisi geri alınacak. Veli/üye paneli erişimi korunur; atanmış etkinliklerden eğitmen ataması kaldırılır. Devam edilsin mi?`,
      )
    ) {
      return;
    }

    setPendingId(instructor.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/admin/members/${instructor.id}/revoke-instructor`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          fullName?: string;
          role?: string;
          unassignedEventCount?: number;
          emailSent?: boolean;
          emailError?: string | null;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen yetkisi geri alınamadı.");
      }

      const name = payload.data?.fullName ?? instructor.fullName;
      const roleLabel =
        payload.data?.role === "parent"
          ? "veli"
          : payload.data?.role === "admin"
            ? "admin"
            : "üye öğrenci";
      const eventNote =
        (payload.data?.unassignedEventCount ?? 0) > 0
          ? ` ${payload.data?.unassignedEventCount} etkinlikten eğitmen ataması kaldırıldı.`
          : "";

      if (payload.data?.emailSent) {
        setSuccess(
          `${name} için eğitmen yetkisi kaldırıldı (${roleLabel} erişimi devam ediyor).${eventNote} Bilgilendirme e-postası gönderildi.`,
        );
      } else if (payload.data?.emailError) {
        setSuccess(
          `${name} için eğitmen yetkisi kaldırıldı.${eventNote} E-posta gönderilemedi: ${payload.data.emailError}`,
        );
      } else {
        setSuccess(
          `${name} için eğitmen yetkisi kaldırıldı.${eventNote} (RESEND_API_KEY tanımlı değil veya e-posta yok; bildirim gönderilmedi.)`,
        );
      }

      router.refresh();
    } catch (demoteError) {
      setError(demoteError instanceof Error ? demoteError.message : "İşlem başarısız.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-6">
        <h2 className="text-lg font-bold text-navy-950">Eğitmen nasıl eklenir?</h2>
        <p className="mt-2 text-sm text-slate-700">
          Yeni eğitmen eklemenin en kolay yolu{" "}
          <Link href="/admin/members" className="font-semibold text-document-primary hover:underline">
            Veliler ve Üyeler
          </Link>{" "}
          listesinden mevcut bir hesaba <strong>Eğitmen yap</strong> demektir. Veli/üye rolü
          korunur; aynı hesap hem veli hem eğitmen paneline girebilir.
        </p>
      </div>

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
            Henüz eğitmen yok. Üye listesinden bir hesaba eğitmen yetkisi verin.
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
                    Hesap türü: {instructor.memberRole} · Oluşturulma:{" "}
                    {formatDate(instructor.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    className="border-violet-300 text-violet-900 hover:bg-violet-50"
                    disabled={pendingId === instructor.id}
                    onClick={() => void revokeInstructorRole(instructor)}
                  >
                    {pendingId === instructor.id ? "Kaydediliyor..." : "Yetkiyi geri al"}
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
