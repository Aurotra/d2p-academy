"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { Button } from "@/presentation/components/ui/button";

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
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
  hasActiveCertificate: boolean;
  hasPaidPayment: boolean;
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
  return status === "registered" || status === "attended";
}

function canRemoveFromEvent(row: EventEnrollmentRow): boolean {
  return row.status !== "cancelled" && !row.hasActiveCertificate;
}

function canSelectForBulk(row: EventEnrollmentRow): boolean {
  return canRemoveFromEvent(row);
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
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [showBulkCancelConfirm, setShowBulkCancelConfirm] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [paymentRefundWarning, setPaymentRefundWarning] = useState<string | null>(null);
  const [cancelSummary, setCancelSummary] = useState<string | null>(null);

  useEffect(() => {
    setRemovedIds(new Set());
  }, [enrollments]);

  const visibleEnrollments = useMemo(
    () => enrollments.filter((row) => !removedIds.has(row.id)),
    [enrollments, removedIds],
  );

  const selectableIds = useMemo(
    () => visibleEnrollments.filter((row) => canSelectForBulk(row)).map((row) => row.id),
    [visibleEnrollments],
  );

  const completableIds = useMemo(
    () => visibleEnrollments.filter((row) => canMarkCompleted(row.status)).map((row) => row.id),
    [visibleEnrollments],
  );

  const selectedIdsList = useMemo(
    () => selectableIds.filter((id) => selectedIds.has(id)),
    [selectableIds, selectedIds],
  );

  const selectedCompletable = useMemo(
    () => completableIds.filter((id) => selectedIds.has(id)),
    [completableIds, selectedIds],
  );

  const allSelectableSelected =
    selectableIds.length > 0 && selectedIdsList.length === selectableIds.length;

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
      if (selectableIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(selectableIds);
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
      setShowBulkCancelConfirm(false);
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function removeFromEvent(ids: string[]) {
    if (ids.length === 0) return;

    setIsUpdating(true);
    setError(null);
    setPaymentRefundWarning(null);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentIds: ids,
          reason: removeReason.trim() || null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        warning?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Öğrenci kurstan çıkarılamadı.");
      }

      setPendingRemoveId(null);
      setShowBulkRemoveConfirm(false);
      setRemoveReason("");
      setRemovedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          next.add(id);
        }
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          next.delete(id);
        }
        return next;
      });

      if (payload.warning === "payment_not_refunded") {
        setPaymentRefundWarning(
          payload.message ??
            "Bu kaydın ödemesi var; iptal edilirken ödeme otomatik iade edilmedi. Manuel iadeyi PayTR panelinden yapmayı unutmayın.",
        );
      }

      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  const pendingStudent = pendingSingleId
    ? visibleEnrollments.find((row) => row.id === pendingSingleId)
    : null;

  const pendingRemoveStudent = pendingRemoveId
    ? visibleEnrollments.find((row) => row.id === pendingRemoveId)
    : null;

  const bulkCompleteStudents = visibleEnrollments.filter((row) =>
    selectedCompletable.includes(row.id),
  );
  const bulkRemoveStudents = visibleEnrollments.filter((row) => selectedIdsList.includes(row.id));
  const bulkCancelStudents = bulkRemoveStudents;
  const selectedPaidCount = bulkCancelStudents.filter((row) => row.hasPaidPayment).length;

  async function softCancelEnrollments(ids: string[]) {
    if (ids.length === 0) return;

    setIsUpdating(true);
    setError(null);
    setPaymentRefundWarning(null);
    setCancelSummary(null);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentIds: ids,
          status: "cancelled",
          reason: cancelReason.trim() || null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        warning?: string;
        message?: string;
        cancelledCount?: number;
        paidEnrollmentCount?: number;
        paidEnrollmentIds?: string[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıtlar iptal edilemedi.");
      }

      const cancelledCount = payload.cancelledCount ?? ids.length;
      const paidCount =
        payload.paidEnrollmentCount ?? payload.paidEnrollmentIds?.length ?? 0;

      setShowBulkCancelConfirm(false);
      setCancelReason("");
      setSelectedIds(new Set());
      setCancelSummary(
        paidCount > 0
          ? `${cancelledCount} kayıt iptal edildi; ${paidCount} tanesinde ödeme vardı ve Bekleyen İadeler kuyruğuna eklendi.`
          : `${cancelledCount} kayıt iptal edildi (ödemeli kayıt yok).`,
      );

      if (payload.warning === "payment_not_refunded") {
        setPaymentRefundWarning(
          payload.message ??
            "Ödemeli kayıtlar iptal edildi; otomatik iade yok. Bekleyen İadeler listesini kontrol edin.",
        );
      }

      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div>
      {selectableIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border-surface px-5 py-3">
          <Button
            type="button"
            variant="secondary"
            disabled={selectedCompletable.length === 0 || isUpdating}
            onClick={() => {
              setShowBulkRemoveConfirm(false);
              setShowBulkCancelConfirm(false);
              setShowBulkConfirm(true);
            }}
            className="min-h-[40px] px-3 py-2 text-xs"
          >
            Seçilenleri tamamlandı yap
            {selectedCompletable.length > 0 ? ` (${selectedCompletable.length})` : ""}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={selectedIdsList.length === 0 || isUpdating}
            onClick={() => {
              setShowBulkConfirm(false);
              setShowBulkRemoveConfirm(false);
              setShowBulkCancelConfirm(true);
            }}
            className="min-h-[40px] px-3 py-2 text-xs text-rose-800 hover:bg-rose-50"
          >
            Seçilenleri iptal et
            {selectedIdsList.length > 0 ? ` (${selectedIdsList.length})` : ""}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={selectedIdsList.length === 0 || isUpdating}
            onClick={() => {
              setShowBulkConfirm(false);
              setShowBulkCancelConfirm(false);
              setShowBulkRemoveConfirm(true);
            }}
            className="min-h-[40px] px-3 py-2 text-xs text-amber-800 hover:bg-amber-50"
          >
            Seçilenleri kurstan çıkar
            {selectedIdsList.length > 0 ? ` (${selectedIdsList.length})` : ""}
          </Button>
          {selectedIdsList.length > 0 ? (
            <p className="text-xs text-subtle">{selectedIdsList.length} öğrenci seçildi</p>
          ) : (
            <p className="text-xs text-subtle">Toplu işlem için öğrencileri seçin</p>
          )}
        </div>
      ) : null}

      {showBulkConfirm ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            Seçilen {bulkCompleteStudents.length} öğrencinin “{eventTitle}” eğitimini tamamladığını
            onaylıyor musunuz?
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80">
            {bulkCompleteStudents.slice(0, 8).map((student) => (
              <li key={student.id}>{student.studentName}</li>
            ))}
            {bulkCompleteStudents.length > 8 ? (
              <li>…ve {bulkCompleteStudents.length - 8} kişi daha</li>
            ) : null}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void markCompleted(selectedCompletable)}
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

      {showBulkRemoveConfirm ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            Seçilen {bulkRemoveStudents.length} öğrenciyi “{eventTitle}” etkinliğinden çıkarmak
            istediğinize emin misiniz?
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Kayıt, yoklama ve form verileri tamamen silinir; atanmış kurs/sertifika numaraları serbest
            bırakılır. Aktif sertifikası olanlar seçilemez. İşlem loglara yazılır. Bu, “İptal Et”
            işleminden farklıdır.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80">
            {bulkRemoveStudents.slice(0, 8).map((student) => (
              <li key={student.id}>{student.studentName}</li>
            ))}
            {bulkRemoveStudents.length > 8 ? (
              <li>…ve {bulkRemoveStudents.length - 8} kişi daha</li>
            ) : null}
          </ul>
          <label className="mt-3 block text-xs font-semibold text-amber-900">
            Çıkarma nedeni (opsiyonel)
            <input
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-navy-950"
              placeholder="Örn. yanlış kayıt / katılmayacak"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void removeFromEvent(selectedIdsList)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isUpdating ? "Çıkarılıyor..." : "Evet, kurstan çıkar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => {
                setShowBulkRemoveConfirm(false);
                setRemoveReason("");
              }}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      {showBulkCancelConfirm ? (
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-950">
          <p className="font-semibold">
            Seçilen {bulkCancelStudents.length} kaydı iptal etmek (cancelled) istediğinize emin
            misiniz?
          </p>
          <p className="mt-1 text-xs text-rose-900/80">
            Kayıt silinmez; durum “İptal” olur. Yoklama/form verisi kalır. Bu işlem “Kurstan çıkar”
            (kalıcı silme) değildir.
          </p>
          {selectedPaidCount > 0 ? (
            <p className="mt-2 rounded-xl border border-rose-200 bg-white/70 px-3 py-2 text-xs font-semibold text-rose-900">
              Seçilen {bulkCancelStudents.length} kayıttan {selectedPaidCount} tanesi ödemeli —
              iptal sonrası Bekleyen İadeler listesine düşecek. Otomatik iade yok.
            </p>
          ) : null}
          <ul className="mt-2 list-inside list-disc text-xs text-rose-900/80">
            {bulkCancelStudents.slice(0, 8).map((student) => (
              <li key={student.id}>
                {student.studentName}
                {student.hasPaidPayment ? " (ödemeli)" : ""}
              </li>
            ))}
            {bulkCancelStudents.length > 8 ? (
              <li>…ve {bulkCancelStudents.length - 8} kişi daha</li>
            ) : null}
          </ul>
          <label className="mt-3 block text-xs font-semibold text-rose-900">
            İptal nedeni (opsiyonel)
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-navy-950"
              placeholder="Örn. etkinlik iptal / veli talebi"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void softCancelEnrollments(selectedIdsList)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isUpdating ? "İptal ediliyor..." : "Evet, iptal et"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => {
                setShowBulkCancelConfirm(false);
                setCancelReason("");
              }}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Vazgeç
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

      {pendingRemoveStudent ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            {pendingRemoveStudent.studentName} adlı öğrenciyi “{eventTitle}” etkinliğinden çıkarmak
            istediğinize emin misiniz?
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Kayıt, yoklama ve form verileri tamamen silinir; atanmış kurs/sertifika numarası serbest
            bırakılır. Öğrenci hiç kayıt olmamış gibi temiz duruma döner. Aktif sertifikası varsa önce
            sertifikayı iptal etmelisiniz. İşlem loglara yazılır.
          </p>
          <label className="mt-3 block text-xs font-semibold text-amber-900">
            Çıkarma nedeni (opsiyonel)
            <input
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-navy-950"
              placeholder="Örn. yanlış kayıt / katılmayacak"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void removeFromEvent([pendingRemoveStudent.id])}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              {isUpdating ? "Çıkarılıyor..." : "Evet, kurstan çıkar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => {
                setPendingRemoveId(null);
                setRemoveReason("");
              }}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      {cancelSummary ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-950">
          <p className="font-semibold">{cancelSummary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/admin/refund-followups"
              className="text-xs font-semibold text-emerald-900 underline hover:text-emerald-950"
            >
              Bekleyen İadeler →
            </Link>
            <button
              type="button"
              className="text-xs font-semibold text-emerald-900 underline"
              onClick={() => setCancelSummary(null)}
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}

      {paymentRefundWarning ? (
        <div
          role="alertdialog"
          aria-labelledby="payment-refund-warning-title"
          className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950"
        >
          <p id="payment-refund-warning-title" className="font-semibold">
            Ödeme otomatik iade edilmedi
          </p>
          <p className="mt-1 text-xs text-amber-900/90">{paymentRefundWarning}</p>
          <p className="mt-2 text-xs text-amber-900/80">
            Bu kaydın ödemesi vardı. İptal tamamlandı; manuel iade işlemini PayTR panelinden
            yapmayı unutmayın.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentRefundWarning(null)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Anladım
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-surface text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="w-10 px-5 py-3">
                {selectableIds.length > 0 ? (
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleAll}
                    aria-label="Tümünü seç"
                    className="size-4 rounded border-border-surface text-document-primary"
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
            {visibleEnrollments.map((enrollment) => {
              const eligible = canMarkCompleted(enrollment.status);
              const selectable = canSelectForBulk(enrollment);

              return (
                <tr key={enrollment.id} className="border-b border-border-surface last:border-0">
                  <td className="px-5 py-4">
                    {selectable ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(enrollment.id)}
                        onChange={() => toggleOne(enrollment.id)}
                        aria-label={`${enrollment.studentName} seç`}
                        className="size-4 rounded border-border-surface text-document-primary"
                      />
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-950">{enrollment.studentName}</p>
                    <p className="text-xs text-subtle">{enrollment.studentEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                      {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {formatDate(enrollment.registeredAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/enrollments/${enrollment.id}/forms`}
                        className="inline-flex min-h-[40px] items-center rounded-xl px-3 py-2 text-xs font-semibold text-document-primary hover:bg-document-primary/5"
                      >
                        Formlar
                      </Link>
                      {enrollment.status === "completed" ? (
                        enrollment.hasActiveCertificate ? (
                          <span className="text-xs font-semibold text-secondary">
                            Sertifika verildi
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700">
                            Sertifikaya hazır
                          </span>
                        )
                      ) : eligible ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() => {
                            setShowBulkConfirm(false);
                            setShowBulkRemoveConfirm(false);
                            setPendingRemoveId(null);
                            setPendingSingleId(enrollment.id);
                          }}
                          className="min-h-[40px] px-3 py-2 text-xs"
                        >
                          Tamamlandı
                        </Button>
                      ) : null}
                      {canRemoveFromEvent(enrollment) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isUpdating}
                          onClick={() => {
                            setShowBulkConfirm(false);
                            setShowBulkRemoveConfirm(false);
                            setPendingSingleId(null);
                            setPendingRemoveId(enrollment.id);
                          }}
                          className="min-h-[40px] px-3 py-2 text-xs text-amber-800 hover:bg-amber-50"
                          title="Öğrenciyi etkinlikten çıkar"
                        >
                          Kurstan çıkar
                        </Button>
                      ) : enrollment.hasActiveCertificate ? (
                        <span className="text-xs text-subtle">Önce sertifikayı iptal edin</span>
                      ) : null}
                    </div>
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
