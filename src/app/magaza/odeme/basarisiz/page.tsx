import Link from "next/link";

import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function StorePaymentFailPage({ searchParams }: PageProps) {
  const { orderId } = await searchParams;
  let retryHref = "/magaza";

  if (orderId) {
    try {
      const client = createServiceRoleClient();
      const { data } = await client.from("store_orders").select("*").eq("id", orderId).maybeSingle();
      if (data) {
        const order = mapStoreOrderRow(data as StoreOrderRow);
        retryHref = `/magaza/${order.productSlug}/satin-al`;
      }
    } catch {
      // Keep magaza home fallback.
    }
  }

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-3xl font-black text-navy-950">Ödeme tamamlanamadı</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Kart işlemi başarısız oldu veya iptal edildi. Bilgilerinizi kontrol edip yeniden
          deneyebilirsiniz.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={retryHref}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
          >
            Tekrar dene
          </Link>
          <Link
            href="/magaza"
            className="inline-flex items-center justify-center rounded-full border border-border-surface bg-white px-6 py-3 text-sm font-semibold text-navy-950"
          >
            Mağazaya dön
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}