"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/presentation/components/ui/button";

export type RefundFollowupStatus = "open" | "refunded_manual" | "waived";

export interface RefundFollowupRow {
  id: string;
  eventTitle: string | null;
  studentName: string | null;
  studentEmail: string | null;
  amountTryCents: number;
  providerPaymentId: string | null;
  provider: string;
  cancelledAt: string;
  cancelledByEmail: string | null;
  reason: string | null;
  status: RefundFollowupStatus;
  note: string | null;
}

const STATUS_LABELS: Record<RefundFollowupStatus, string> = {
  open: "Bekliyor",
  refunded_manual: "Manuel iade",
  waived: "Vazgeçildi",
};

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

interface AdminRefundFollowupsManagerProps {
  initialRows: RefundFollowupRow[];
  initialStatus: RefundFollowupStatus | "all";
}

export function AdminRefundFollowupsManager({
  initialRows,
  initialStatus,
}: AdminRefundFollowupsManagerProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const pendingRow = useMemo(
    () => rows.find((row) => row.id === pendingId) ?? null,
    [rows, pendingId],
  );

  async function resolve(id: string, status: "refunded_manual" | "waived") {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/refund-followups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || null }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Güncellenemedi.");
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                note: note.trim() || null,
              }
            : row,
        ),
      );
      setPendingId(null);
      setNote("");
      router.refresh();
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  function changeFilter(next: RefundFollowupStatus | "all") {
    setStatusFilter(next);
    const query = next === "open" ? "" : `?status=${next}`;
    router.push(`/admin/refund-followups${query}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["open", "Bekleyen"],
            ["refunded_manual", "Manuel iade"],
            ["waived", "Vazgeçildi"],
            ["all", "Tümü"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === value
                ? "bg-document-primary text-white"
                : "bg-surface-section text-navy-900 hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {pendingRow ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            {pendingRow.studentName ?? "Öğrenci"} — {formatMoney(pendingRow.amountTryCents)}
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            PayTR işlem no: {pendingRow.providerPaymentId ?? "—"} · İade panelden manuel
            yapıldıysa veya iade gerekmiyorsa işaretleyin.
          </p>
          <label className="mt-3 block text-xs font-semibold">
            Not (opsiyonel)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-navy-950"
              placeholder="Örn. PayTR panelinden iade edildi / etkinlik iptali, iade yok"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isUpdating}
              onClick={() => void resolve(pendingRow.id, "refunded_manual")}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Manuel iade yapıldı
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => void resolve(pendingRow.id, "waived")}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Vazgeçildi (waived)
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isUpdating}
              onClick={() => {
                setPendingId(null);
                setNote("");
              }}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              İptal
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-border-surface bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-surface text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-5 py-3">Etkinlik</th>
              <th className="px-5 py-3">Öğrenci</th>
              <th className="px-5 py-3">Tutar</th>
              <th className="px-5 py-3">İşlem no</th>
              <th className="px-5 py-3">İptal</th>
              <th className="px-5 py-3">Durum</th>
              <th className="px-5 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-sm text-muted">
                  Bu filtrede kayıt yok.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border-surface last:border-0">
                  <td className="px-5 py-4 font-semibold text-navy-950">
                    {row.eventTitle ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-950">{row.studentName ?? "—"}</p>
                    <p className="text-xs text-subtle">{row.studentEmail}</p>
                  </td>
                  <td className="px-5 py-4">{formatMoney(row.amountTryCents)}</td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {row.providerPaymentId ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    <p>{formatDate(row.cancelledAt)}</p>
                    <p className="text-xs text-subtle">{row.cancelledByEmail ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-document-primary/10 px-3 py-1 text-xs font-bold text-document-primary">
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {row.status === "open" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdating}
                        onClick={() => setPendingId(row.id)}
                        className="min-h-[40px] px-3 py-2 text-xs"
                      >
                        Çöz
                      </Button>
                    ) : (
                      <span className="text-xs text-subtle">{row.note ?? "—"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
