import Link from "next/link";
import { notFound } from "next/navigation";

import { PaytrCheckoutFrame } from "@/presentation/components/payments/paytr-checkout-frame";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { rotateStorePaytrCheckout } from "@/infrastructure/store/start-store-checkout";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { formatTryCentsDisplay } from "@/core/domain/payment";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fresh?: string }>;
}

export default async function StorePaymentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    notFound();
  }

  const { data } = await serviceClient
    .from("store_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const order = mapStoreOrderRow(data as StoreOrderRow);

  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "completed") {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-navy-950">Ödeme alındı</h1>
          <p className="mt-2 text-sm text-muted">
            Siparişiniz ({order.orderNumber}) ödendi. Kargo hazırlığına alındı.
          </p>
          <Link href="/magaza" className="mt-6 inline-flex font-semibold text-document-primary hover:underline">
            Mağazaya dön
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  if (order.status !== "pending_payment" && order.status !== "failed") {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-navy-950">Ödeme kullanılamıyor</h1>
          <p className="mt-2 text-sm text-muted">Bu sipariş için kart ödemesi açılamaz.</p>
          <Link
            href={`/magaza/${order.productSlug}/satin-al`}
            className="mt-6 inline-flex font-semibold text-document-primary hover:underline"
          >
            Yeni sipariş başlat
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  let iframeUrl =
    order.providerRaw && typeof order.providerRaw.iframeUrl === "string"
      ? order.providerRaw.iframeUrl
      : null;

  const createdAt = new Date(order.updatedAt || order.createdAt).getTime();
  const shouldRotate = query.fresh === "1" || Date.now() - createdAt > 2 * 60 * 1000 || !iframeUrl;

  if (shouldRotate) {
    try {
      const rotated = await rotateStorePaytrCheckout({
        serviceClient,
        orderId: order.id,
        buyerIp: "85.34.78.112",
      });
      iframeUrl = rotated.iframeUrl;
    } catch (error) {
      console.error("[magaza odeme rotate]", error);
    }
  }

  if (!iframeUrl) {
    return (
      <PublicPageShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-navy-950">Ödeme formu açılamadı</h1>
          <p className="mt-2 text-sm text-muted">Lütfen siparişi yeniden başlatın.</p>
          <Link
            href={`/magaza/${order.productSlug}/satin-al`}
            className="mt-6 inline-flex font-semibold text-document-primary hover:underline"
          >
            Tekrar dene
          </Link>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black text-navy-950">Güvenli ödeme</h1>
        <p className="mt-2 text-sm text-muted">
          {order.productTitle} · {formatTryCentsDisplay(order.amountTryCents)} · Sipariş{" "}
          {order.orderNumber}
        </p>
        <PaytrCheckoutFrame
          iframeUrl={iframeUrl}
          enrollHref={`/magaza/${order.productSlug}/satin-al`}
        />
      </div>
    </PublicPageShell>
  );
}
