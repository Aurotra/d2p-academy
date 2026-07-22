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

function roleLabel(role: AdminMember["role"]): string {
  return role === "parent" ? "Veli" : "Üye öğrenci";
}

function promoteConfirmMessage(member: AdminMember): string {
  const base =
    member.role === "parent"
      ? `${member.fullName} veli hesabından eğitmen yapılacak. Veli paneline erişemez; /instructor panelini kullanır.`
      : `${member.fullName} üye öğrenci hesabından eğitmen yapılacak. Öğrenci paneline erişemez; /instructor panelini kullanır.`;

  return `${base}\n\nDevam edilsin mi?`;
}

export function AdminMembersTable({ members }: { members: AdminMember[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function promoteToInstructor(member: AdminMember) {
    if (!window.confirm(promoteConfirmMessage(member))) {
      return;
    }

    setPendingId(member.id);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/members/${member.id}/promote-instructor`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Eğitmen yetkisi verilemedi.");
      }

      router.refresh();
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : "İşlem başarısız.");
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
                <th className="px-5 py-4">İşlem</th>
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
                            : "bg-amber-100 text-amber-900"
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
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!member.isActive || pendingId === member.id}
                        onClick={() => void promoteToInstructor(member)}
                      >
                        {pendingId === member.id ? "Kaydediliyor..." : "Eğitmen yap"}
                      </Button>
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
