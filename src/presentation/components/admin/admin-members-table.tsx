"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminMember } from "@/core/domain/admin-member";
import { Button } from "@/presentation/components/ui/button";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function roleLabel(role: string): string {
  if (role === "parent") return "Veli";
  if (role === "student") return "Üye öğrenci";
  if (role === "instructor") return "Eğitmen (eski kayıt)";
  return role;
}

function promoteConfirmMessage(member: AdminMember): string {
  const roleNote =
    member.role === "parent"
      ? "Veli paneli erişimi korunur; ayrıca Eğitmen Paneli açılır."
      : "Üye paneli erişimi korunur; ayrıca Eğitmen Paneli açılır.";

  return `${member.fullName} için eğitmen yetkisi verilecek. ${roleNote}\n\nDevam edilsin mi?`;
}

export function AdminMembersTable({ members }: { members: AdminMember[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function promoteToInstructor(member: AdminMember) {
    if (!window.confirm(promoteConfirmMessage(member))) {
      return;
    }

    setPendingId(member.id);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/v1/admin/members/${member.id}/promote-instructor`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { fullName?: string; emailSent?: boolean; emailError?: string | null };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen yetkisi verilemedi.");
      }

      const name = payload.data?.fullName ?? member.fullName;
      if (payload.data?.emailSent) {
        setSuccess(`${name} eğitmen yapıldı. Bilgilendirme e-postası gönderildi.`);
      } else {
        setSuccess(`${name} eğitmen yapıldı.`);
        setWarning(
          payload.data?.emailError ??
            "Bilgilendirme e-postası gönderilemedi. Vercel RESEND_API_KEY veya Supabase send-instructor-email fonksiyonunu kontrol edin.",
        );
      }

      router.refresh();
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : "İşlem başarısız.");
    } finally {
      setPendingId(null);
    }
  }

  async function revokeInstructorRole(member: AdminMember) {
    if (
      !window.confirm(
        `${member.fullName} için eğitmen yetkisi geri alınacak. Veli/üye paneli erişimi korunur; atanmış etkinliklerden eğitmen ataması kaldırılır. Devam edilsin mi?`,
      )
    ) {
      return;
    }

    setPendingId(member.id);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/v1/admin/members/${member.id}/revoke-instructor`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          fullName?: string;
          unassignedEventCount?: number;
          emailSent?: boolean;
          emailError?: string | null;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen yetkisi geri alınamadı.");
      }

      const name = payload.data?.fullName ?? member.fullName;
      const eventNote =
        (payload.data?.unassignedEventCount ?? 0) > 0
          ? ` ${payload.data?.unassignedEventCount} etkinlikten eğitmen ataması kaldırıldı.`
          : "";

      if (payload.data?.emailSent) {
        setSuccess(`${name} için eğitmen yetkisi kaldırıldı.${eventNote} Bilgilendirme e-postası gönderildi.`);
      } else {
        setSuccess(`${name} için eğitmen yetkisi kaldırıldı.${eventNote}`);
        setWarning(
          payload.data?.emailError ??
            "Bilgilendirme e-postası gönderilemedi. Vercel RESEND_API_KEY veya Supabase send-instructor-email fonksiyonunu kontrol edin.",
        );
      }

      router.refresh();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "İşlem başarısız.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
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
      {warning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Ad Soyad</th>
                <th className="px-5 py-4">E-posta</th>
                <th className="px-5 py-4">Tür</th>
                <th className="px-5 py-4">Telefon</th>
                <th className="px-5 py-4">Çocuk</th>
                <th className="px-5 py-4">Kayıt</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Eğitmen yetkisi</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    Kayıtlı üye bulunamadı.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4 font-semibold text-slate-900">{member.fullName}</td>
                    <td className="px-5 py-4 text-slate-700">{member.email ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          member.role === "parent"
                            ? "bg-sky-100 text-sky-900"
                            : member.role === "student"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-violet-100 text-violet-900"
                        }`}
                      >
                        {roleLabel(member.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{member.phone ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {member.role === "parent" ? member.childCount : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(member.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          member.isActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {member.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {member.isInstructor ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                            Aktif
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={pendingId === member.id}
                            onClick={() => void revokeInstructorRole(member)}
                          >
                            {pendingId === member.id ? "Kaydediliyor..." : "Yetkiyi geri al"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!member.isActive || pendingId === member.id}
                          onClick={() => void promoteToInstructor(member)}
                        >
                          {pendingId === member.id ? "Kaydediliyor..." : "Eğitmen yap"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
