"use client";

import { useEffect, useMemo, useState } from "react";

import {
  STORE_ORDER_STATUS_LABELS,
  type StoreOrder,
  type StoreOrderStatus,
} from "@/core/domain/store-order";
import { formatTryCentsDisplay } from "@/core/domain/payment";

const STATUS_FILTERS: Array<{ value: "" | StoreOrderStatus; label: string }> = [
  { value: "", label: "Tümü" },
  { value: "paid", label: "Ödendi" },
  { value: "processing", label: "Hazırlanıyor" },
  { value: "shipped", label: "Kargoda" },
  { value: "completed", label: "Tamamlandı" },
  { value: "pending_payment", label: "Ödeme bekliyor" },
  { value: "failed", label: "Başarısız" },
  { value: "cancelled", label: "İptal" },
  { value: "refunded", label: "İade" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function AdminStoreOrdersManager({
  initialOrders,
  highlightOrderNumber,
}: {
  initialOrders: StoreOrder[];
  highlightOrderNumber?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [status, setStatus] = useState<"" | StoreOrderStatus>("");
  const [query, setQuery] = useState(highlightOrderNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredHint = useMemo(() => {
    if (!status && !query.trim()) return `${orders.length} sipariş`;
    return `${orders.length} sonuç`;
  }, [orders.length, query, status]);

  async function reload(nextStatus = status, nextQuery = query) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextStatus) params.set("status", nextStatus);
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const response = await fetch(`/api/v1/admin/store-orders?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        data?: StoreOrder[];
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Siparişler yüklenemedi.");
      }
      setOrders(payload?.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Siparişler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (highlightOrderNumber) {
      void reload("", highlightOrderNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightOrderNumber]);

  async function updateOrder(
    orderId: string,
    patch: { status?: StoreOrderStatus; trackingNumber?: string; adminNote?: string },
  ) {
    setSavingId(orderId);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/store-orders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, ...patch }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        data?: StoreOrder;
      } | null;
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || "Güncellenemedi.");
      }
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? payload.data! : order)),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-navy-950">Mağaza Siparişleri</h1>
        <p className="mt-1 text-sm text-muted">
          PayTR ile alınan ürün siparişlerini takip edin, kargo ve durum güncelleyin.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-surface bg-white p-4 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-semibold text-navy-950">
          Ara
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sipariş no, e-posta, telefon..."
            className="mt-1.5 w-full rounded-xl border border-border-surface px-3 py-2.5 text-sm outline-none ring-secondary/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-semibold text-navy-950 sm:w-52">
          Durum
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | StoreOrderStatus)}
            className="mt-1.5 w-full rounded-xl border border-border-surface px-3 py-2.5 text-sm outline-none ring-secondary/30 focus:ring-2"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="rounded-full bg-document-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Yükleniyor..." : "Filtrele"}
        </button>
      </div>

      <p className="text-sm text-muted">{filteredHint}</p>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <ul className="space-y-4">
        {orders.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border-surface bg-white px-5 py-10 text-center text-sm text-muted">
            Sipariş bulunamadı.
          </li>
        ) : (
          orders.map((order) => {
            const highlighted =
              highlightOrderNumber &&
              order.orderNumber.toLowerCase() === highlightOrderNumber.toLowerCase();
            return (
              <li
                key={order.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  highlighted ? "border-secondary ring-2 ring-secondary/30" : "border-border-surface"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      {order.orderNumber}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-navy-950">{order.productTitle}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {order.quantity} adet · {formatTryCentsDisplay(order.amountTryCents)} ·{" "}
                      {STORE_ORDER_STATUS_LABELS[order.status]}
                    </p>
                    <p className="mt-1 text-xs text-subtle">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-sm text-navy-950 sm:text-right">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-muted">{order.customerEmail}</p>
                    <p className="text-muted">{order.customerPhone}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-[var(--text-on-surface-soft)]">
                  {[order.shippingAddress, order.shippingDistrict, order.shippingCity]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.customerNote ? (
                  <p className="mt-2 text-sm text-muted">Not: {order.customerNote}</p>
                ) : null}

                <div className="mt-4 grid gap-3 border-t border-border-surface pt-4 sm:grid-cols-3">
                  <label className="block text-sm font-semibold text-navy-950">
                    Durum
                    <select
                      value={order.status}
                      disabled={savingId === order.id}
                      onChange={(event) =>
                        void updateOrder(order.id, {
                          status: event.target.value as StoreOrderStatus,
                        })
                      }
                      className="mt-1.5 w-full rounded-xl border border-border-surface px-3 py-2 text-sm"
                    >
                      {(Object.keys(STORE_ORDER_STATUS_LABELS) as StoreOrderStatus[]).map(
                        (value) => (
                          <option key={value} value={value}>
                            {STORE_ORDER_STATUS_LABELS[value]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-navy-950">
                    Kargo takip no
                    <input
                      defaultValue={order.trackingNumber ?? ""}
                      disabled={savingId === order.id}
                      onBlur={(event) => {
                        const next = event.target.value.trim();
                        if (next === (order.trackingNumber ?? "")) return;
                        void updateOrder(order.id, { trackingNumber: next });
                      }}
                      className="mt-1.5 w-full rounded-xl border border-border-surface px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-navy-950">
                    Admin notu
                    <input
                      defaultValue={order.adminNote ?? ""}
                      disabled={savingId === order.id}
                      onBlur={(event) => {
                        const next = event.target.value.trim();
                        if (next === (order.adminNote ?? "")) return;
                        void updateOrder(order.id, { adminNote: next });
                      }}
                      className="mt-1.5 w-full rounded-xl border border-border-surface px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
