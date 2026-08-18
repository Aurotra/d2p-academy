"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { formatTryCentsDisplay } from "@/core/domain/payment";
import {
  ADMIN_PAYMENT_METHOD_LABELS,
  ADMIN_PAYMENT_STATUS_LABELS,
  whatsappHref,
  type AdminPaymentLedgerRow,
  type AdminPaymentMethodFilter,
  type AdminPaymentStatusFilter,
  type AdminPaymentsView,
} from "@/infrastructure/payments/admin-payment-ledger";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

interface AdminPaymentsManagerProps {
  rows: AdminPaymentLedgerRow[];
  stuckCount: number;
  view: AdminPaymentsView;
  method: AdminPaymentMethodFilter;
  status: AdminPaymentStatusFilter;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function statusLabel(row: AdminPaymentLedgerRow): string {
  if (row.kind === "kurum_enrollment") {
    return row.status === "pending" ? "Kurum kaydı (bekliyor)" : "Kurum kaydı";
  }
  if (row.isStuck) {
    return row.status === "failed" ? "Takılı (başarısız)" : "Takılı (bekliyor)";
  }
  return ADMIN_PAYMENT_STATUS_LABELS[row.status];
}

function hrefFor(input: {
  view: AdminPaymentsView;
  method: AdminPaymentMethodFilter;
  status: AdminPaymentStatusFilter;
}): string {
  const params = new URLSearchParams();
  if (input.view === "stuck") params.set("view", "stuck");
  if (input.method !== "all") params.set("method", input.method);
  if (input.status !== "all") params.set("status", input.status);
  const query = params.toString();
  return query ? `/admin/payments?${query}` : "/admin/payments";
}

export function AdminPaymentsManager({
  rows,
  stuckCount,
  view,
  method,
  status,
}: AdminPaymentsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [havaleId, setHavaleId] = useState<string | null>(null);
  const [receiptNo, setReceiptNo] = useState("");
  const [note, setNote] = useState("");
  const [amountTry, setAmountTry] = useState("");

  const havaleRow = useMemo(
    () => rows.find((row) => row.id === havaleId) ?? null,
    [rows, havaleId],
  );

  async function releaseSeat(paymentId: string) {
    setBusyId(paymentId);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/payments/${paymentId}/release`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Koltuk bırakılamadı.");
      }
      router.refresh();
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : "İşlem başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function closeHavale(paymentId: string) {
    setBusyId(paymentId);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/payments/${paymentId}/close-havale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountTry: amountTry.trim() || undefined,
          receiptNo: receiptNo.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Havale ile kapatılamadı.");
      }
      setHavaleId(null);
      setReceiptNo("");
      setNote("");
      setAmountTry("");
      router.refresh();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "İşlem başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefFor({ view: "stuck", method: "all", status: "all" })}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            view === "stuck"
              ? "bg-amber-600 text-white"
              : "bg-amber-50 text-amber-950 hover:bg-amber-100"
          }`}
        >
          Takılı kart{stuckCount > 0 ? ` (${stuckCount})` : ""}
        </Link>
        <Link
          href={hrefFor({ view: "ledger", method: "all", status: "all" })}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            view === "ledger" && method === "all" && status === "all"
              ? "bg-document-primary text-white"
              : "bg-surface-section text-navy-900 hover:bg-white"
          }`}
        >
          Tüm ödemeler
        </Link>
      </div>

      {view === "ledger" ? (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Yöntem: tümü"],
              ["card", "Kart"],
              ["havale", "Havale"],
              ["kurum", "Kurum"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={hrefFor({ view: "ledger", method: value, status })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                method === value
                  ? "bg-navy-950 text-white"
                  : "bg-surface-section text-navy-900 hover:bg-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}

      {view === "ledger" ? (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Durum: tümü"],
              ["paid", "Ödendi"],
              ["pending", "Bekliyor"],
              ["failed", "Başarısız"],
              ["cancelled", "İptal"],
              ["refunded", "İade"],
            ] as const satisfies ReadonlyArray<readonly [AdminPaymentStatusFilter, string]>
          ).map(([value, label]) => (
            <Link
              key={value}
              href={hrefFor({ view: "ledger", method, status: value })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                status === value
                  ? "bg-navy-950 text-white"
                  : "bg-surface-section text-navy-900 hover:bg-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          PayTR açıldıktan sonra 45 dakika içinde bitmeyen veya başarısız olan, hâlâ kontenjan
          tutan kart denemeleri. Veliye yazın, koltuğu bırakın veya gelen havaleyi işleyin.
        </p>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {havaleRow ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">
            {havaleRow.studentName} — havale ile kapat
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Kart denemesi iptal edilir, koltuk kayıtlı kalır, havale ödendi yazılır. Tutar boşsa
            kart tutarı kullanılır.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Tutar (₺, opsiyonel)"
              value={amountTry}
              onChange={(event) => setAmountTry(event.target.value)}
              inputMode="decimal"
              placeholder={
                havaleRow.amountTryCents
                  ? formatTryCentsDisplay(havaleRow.amountTryCents)
                  : "150"
              }
            />
            <Input
              label="Dekont no (opsiyonel)"
              value={receiptNo}
              onChange={(event) => setReceiptNo(event.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Not (opsiyonel)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busyId === havaleRow.id}
              onClick={() => void closeHavale(havaleRow.id)}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Havale alındı, kaydı kapat
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={Boolean(busyId)}
              onClick={() => {
                setHavaleId(null);
                setReceiptNo("");
                setNote("");
                setAmountTry("");
              }}
              className="min-h-[40px] px-3 py-2 text-xs"
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-border-surface bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-surface text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-5 py-3">Öğrenci / veli</th>
              <th className="px-5 py-3">Kurs</th>
              <th className="px-5 py-3">Tutar</th>
              <th className="px-5 py-3">Yöntem</th>
              <th className="px-5 py-3">Durum</th>
              <th className="px-5 py-3">Tarih</th>
              <th className="px-5 py-3">Sağlayıcı / dekont</th>
              <th className="px-5 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-sm text-muted">
                  Bu filtrede kayıt yok.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const mailHref = row.parentEmail
                  ? `mailto:${row.parentEmail}?subject=${encodeURIComponent(`D2P Academy — ${row.eventTitle}`)}`
                  : null;
                const waHref = whatsappHref(row.parentPhone);
                const telHref = row.parentPhone
                  ? `tel:${row.parentPhone.replace(/\s+/g, "")}`
                  : null;

                return (
                  <tr key={row.id} className="border-b border-border-surface last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-navy-950">{row.studentName}</p>
                      <p className="text-xs text-subtle">{row.parentName}</p>
                      <p className="text-xs text-subtle">
                        {row.parentEmail ?? "—"}
                        {row.parentPhone ? ` · ${row.parentPhone}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-navy-950">{row.eventTitle}</td>
                    <td className="px-5 py-4">
                      {row.amountTryCents != null
                        ? formatTryCentsDisplay(row.amountTryCents)
                        : "—"}
                    </td>
                    <td className="px-5 py-4">{ADMIN_PAYMENT_METHOD_LABELS[row.method]}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          row.isStuck
                            ? "bg-amber-100 text-amber-950"
                            : "bg-document-primary/10 text-document-primary"
                        }`}
                      >
                        {statusLabel(row)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {formatDate(row.paidAt ?? row.createdAt)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {row.providerRef ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {mailHref ? (
                          <a
                            href={mailHref}
                            className="text-xs font-semibold text-document-primary hover:underline"
                          >
                            E-posta
                          </a>
                        ) : null}
                        {waHref ? (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-document-primary hover:underline"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        {telHref ? (
                          <a
                            href={telHref}
                            className="text-xs font-semibold text-document-primary hover:underline"
                          >
                            Ara
                          </a>
                        ) : null}
                        {row.isStuck && row.kind === "payment" ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busyId === row.id}
                              onClick={() => void releaseSeat(row.id)}
                              className="mt-1 min-h-[36px] px-3 py-1.5 text-xs"
                            >
                              Koltuğu bırak
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={Boolean(busyId)}
                              onClick={() => {
                                setHavaleId(row.id);
                                setAmountTry(
                                  row.amountTryCents
                                    ? (row.amountTryCents / 100).toFixed(
                                        row.amountTryCents % 100 === 0 ? 0 : 2,
                                      )
                                    : "",
                                );
                              }}
                              className="min-h-[36px] px-3 py-1.5 text-xs"
                            >
                              Havale ile kapat
                            </Button>
                          </>
                        ) : null}
                        <Link
                          href={`/admin/enrollments?event_id=${row.eventId}`}
                          className="text-xs font-semibold text-muted hover:underline"
                        >
                          Kayıtlar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
