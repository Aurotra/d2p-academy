"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { Button } from "@/presentation/components/ui/button";

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  registered: "Kayıtlı",
  attended: "Katıldı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  no_show: "Gelmedi",
};

export interface EventEnrollmentRow {
  id: string;
  status: EnrollmentStatus;
  registeredAt: string;
  studentName: string;
  studentEmail: string;
}

interface EventEnrollmentsTableProps {
  eventTitle: string;
  enrollments: EventEnrollmentRow[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function canMarkCompleted(status: EnrollmentStatus): boolean {
  return status !== "completed" && status !== "cancelled" && status !== "no_show";
}

export function EventEnrollmentsTable({
  eventTitle,
  enrollments,
}: EventEnrollmentsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSingleId, setPendingSingleId] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const eligibleIds = useMemo(
    () => enrollments.filter((row) => canMarkCompleted(row.status)).map((row) => row.id),
    [enrollments],
  );

  const selectedEligible = useMemo(
    () => eligibleIds.filter((id) => selectedIds.has(id)),
    [eligibleIds, selectedIds],
  );

  const allEligibleSelected =
    eligibleIds.length > 0 && selectedEligible.length === eligibleIds.length;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (eligibleIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(eligibleIds);
    });
  }

  async function markCompleted(ids: string[]) {
    if (ids.length === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentIds: ids,
          status: "completed",
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Durum güncellenemedi.");
      }

      setSelectedIds(new Set());
      setPendingSingleId(null);
      setShowBulkConfirm(false);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  const pendingStudent = pendingSingleId
    ? enrollments.find((row) => row.id === pendingSingleId)
    : null;

  const bulkStudents = enrollments.filter((row) => selectedEligible.includes(row.id));

  return (
    <div>
      {eligibleIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <Button
            type="button"
            variant="secondary"
            disabled={selectedEligible.length === 0 || isUpdating}
            onClick={() => setShowBulkConfirm(true)}
            className="min-h-[40px] px-3 py-2 text-xs"
          >
            Seçilenleri tamamlandı yap
            {selectedEligible.length > 0 ? ` (${selectedEligible.length})` : ""}
          </Button>
          {selectedEligible.length > 0 ? (
            <p className="text-xs text-slate-500">{selectedEligible.length} öğrenci seçildi</p>
          ) : (
            <p className="text-xs text-slate-500">Toplu işlem için öğrencileri seçin</p>
          )}
        </div>
      ) : null}

      {showBulkConfirm ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            Seçilen {bulkStudents.length} öğrencinin “{eventTitle}” eğitimini tamamladığını
            onaylıyor musunuz?
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80">
            {bulkStudents.slice(0, 8).map((student) => (
              <li key={student.id}>{student.studentName}</li>
            ))}
            {bulkStudents.length > 8 ? <li>…ve {bulkStudents.length - 8} kişi daha</li> : null}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void markCompleted(selectedEligible)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isUpdating ? "Kaydediliyor..." : "Evet, onaylıyorum"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => setShowBulkConfirm(false)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              İptal
            </Button>
          </div>
        </div>
      ) : null}

      {pendingStudent ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            {pendingStudent.studentName} adlı öğrencinin “{eventTitle}” eğitimini tamamladığını
            onaylıyor musunuz?
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Bu işlem yanlışlıkla yapıldıysa iptal edin. Onay sonrası öğrenci sertifika için hazır
            olur.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void markCompleted([pendingStudent.id])}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isUpdating ? "Kaydediliyor..." : "Evet, onaylıyorum"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => setPendingSingleId(null)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              İptal
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-5 py-3">
                {eligibleIds.length > 0 ? (
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleAll}
                    aria-label="Tümünü seç"
                    className="size-4 rounded border-slate-300 text-document-primary"
                  />
                ) : null}
              </th>
              <th className="px-5 py-3">Öğrenci</th>
              <th className="px-5 py-3">Durum</th>
              <th className="px-5 py-3">Kayıt Tarihi</th>
              <th className="px-5 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => {
              const eligible = canMarkCompleted(enrollment.status);

              return (
                <tr key={enrollment.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-4">
                    {eligible ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(enrollment.id)}
                        onChange={() => toggleOne(enrollment.id)}
                        aria-label={`${enrollment.studentName} seç`}
                        className="size-4 rounded border-slate-300 text-document-primary"
                      />
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{enrollment.studentName}</p>
                    <p className="text-xs text-slate-500">{enrollment.studentEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                      {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(enrollment.registeredAt)}
                  </td>
                  <td className="px-5 py-4">
                    {enrollment.status === "completed" ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        Sertifikaya hazır
                      </span>
                    ) : eligible ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdating}
                        onClick={() => {
                          setShowBulkConfirm(false);
                          setPendingSingleId(enrollment.id);
                        }}
                        className="min-h-[40px] px-3 py-2 text-xs"
                      >
                        Tamamlandı
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
