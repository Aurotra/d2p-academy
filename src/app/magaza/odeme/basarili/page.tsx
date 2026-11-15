import Link from "next/link";

import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { formatTryCentsDisplay } from "@/core/domain/payment";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function StorePaymentSuccessPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  let orderNumber = "";
  let amountLabel = "";
  let productTitle = "";

  if (orderId) {
    try {
      const client = createServiceRoleClient();
      const { data } = await client.from("store_orders").select("*").eq("id", orderId).maybeSingle();
      if (data) {
        const order = mapStoreOrderRow(data as StoreOrderRow);
        orderNumber = order.orderNumber;
        amountLabel = formatTryCentsDisplay(order.amountTryCents);
        productTitle = order.productTitle;
      }
    } catch {
      // Ignore lookup failures on success page.
    }
  }

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Ödeme başarılı</p>
        <h1 className="mt-2 text-3xl font-black text-navy-950">Siparişiniz alındı</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {productTitle
            ? `${productTitle} için ödemeniz kayda geçti.`
            : "Ödemeniz kayda geçti."}{" "}
          Siparişiniz hazırlanıp kargoya verildiğinde bilgilendirileceksiniz.
        </p>
        {orderNumber ? (
          <p className="mt-4 text-sm font-semibold text-navy-950">
            Sipariş no: {orderNumber}
            {amountLabel ? ` · ${amountLabel}` : ""}
          </p>
        ) : null}
        <Link
          href="/magaza"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-document-primary px-6 py-3 text-sm font-bold text-white"
        >
          Mağazaya dön
        </Link>
      </div>
    </PublicPageShell>
  );
}
