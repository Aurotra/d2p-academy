"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Product } from "@/core/domain/store";
import { formatTryPrice } from "@/shared/utils/format-try";

interface StoreCheckoutFormProps {
  product: Product;
}

export function StoreCheckoutForm({ product }: StoreCheckoutFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = product.price * quantity;
  const outOfStock = product.stockStatus === "out_of_stock";
  const comingSoon = product.stockStatus === "coming_soon";
  const checkoutBlocked = outOfStock || comingSoon;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checkoutBlocked || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/store/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          quantity,
          customerName,
          customerEmail,
          customerPhone,
          shippingCity,
          shippingDistrict,
          shippingAddress,
          customerNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        data?: { paymentPageUrl?: string };
      } | null;

      if (!response.ok || !payload?.data?.paymentPageUrl) {
        throw new Error(payload?.error || "Ödeme başlatılamadı.");
      }

      router.push(payload.data.paymentPageUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ödeme başlatılamadı.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-[1.5rem] border border-border-surface bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Teslimat bilgileri</h1>
          <p className="mt-1 text-sm text-muted">
            Siparişinizi PayTR güvenli ödeme ile sitemiz üzerinden tamamlayın.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-navy-950 sm:col-span-2">
            Ad soyad
            <input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950">
            E-posta
            <input
              required
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950">
            Telefon
            <input
              required
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="05xx xxx xx xx"
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950">
            İl
            <input
              required
              value={shippingCity}
              onChange={(event) => setShippingCity(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950">
            İlçe
            <input
              value={shippingDistrict}
              onChange={(event) => setShippingDistrict(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950 sm:col-span-2">
            Açık adres
            <textarea
              required
              rows={3}
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-semibold text-navy-950 sm:col-span-2">
            Sipariş notu (opsiyonel)
            <textarea
              rows={2}
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 text-sm outline-none ring-secondary/30 focus:ring-2"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={checkoutBlocked || submitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "PayTR açılıyor..." : "Ödemeye geç"}
        </button>
        <Link href={`/magaza/${product.slug}`} className="block text-center text-sm font-semibold text-document-primary hover:underline">
          Ürüne geri dön
        </Link>
      </div>

      <aside className="h-fit rounded-[1.5rem] border border-border-surface bg-surface-section p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Sipariş özeti</p>
        <h2 className="mt-2 text-lg font-bold text-navy-950">{product.title}</h2>
        <p className="mt-1 text-sm font-medium text-document-primary">{product.subtitle}</p>

        <label className="mt-5 block text-sm font-semibold text-navy-950">
          Adet
          <input
            type="number"
            min={1}
            max={20}
            value={quantity}
            disabled={checkoutBlocked}
            onChange={(event) =>
              setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
            }
            className="mt-1.5 w-28 rounded-xl border border-border-surface bg-white px-3 py-2 text-sm outline-none ring-secondary/30 focus:ring-2"
          />
        </label>

        <div className="mt-5 flex items-end justify-between border-t border-border-surface pt-4">
          <span className="text-sm font-semibold text-muted">Toplam</span>
          <span className="text-2xl font-black text-navy-950">
            {comingSoon ? "Yakında" : formatTryPrice(total)}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-subtle">
          Ödeme PayTR 256-bit SSL ile alınır. Kart bilgileriniz D2P sunucularında saklanmaz.
        </p>
        {outOfStock ? (
          <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            Bu ürün şu an stokta yok.
          </p>
        ) : null}
        {comingSoon ? (
          <p className="mt-3 rounded-xl border border-accent-dark/25 bg-accent/15 px-3 py-2 text-sm text-accent-dark">
            Bu ürün yakında satışa çıkacak. Şimdilik sipariş alınmıyor.
          </p>
        ) : null}
      </aside>
    </form>
  );
}
