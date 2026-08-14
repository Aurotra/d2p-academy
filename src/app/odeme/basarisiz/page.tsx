import Link from "next/link";

import { buttonLinkClasses } from "@/presentation/components/ui/button";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; paymentId?: string }>;
}) {
  const query = await searchParams;
  const reason = query.reason?.trim() ?? "";

  const detail =
    reason === "token"
      ? "Ödeme doğrulama bilgisi eksik."
      : reason === "config"
        ? "Ödeme sistemi yapılandırması eksik."
        : reason === "retrieve"
          ? "Ödeme sonucu iyzico üzerinden doğrulanamadı."
          : "Ödeme tamamlanamadı veya iptal edildi.";

  return (
    <section className="bg-surface-section px-4 py-16 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-lg rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">Ödeme sonucu</p>
        <h1 className="mt-3 text-3xl font-black">Ödeme tamamlanmadı</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-on-surface-soft)]">{detail}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-on-surface-soft)]">
          Kontenjanınız kısa süre tutulabilir. Çocuklarım sayfasından kaydı yeniden deneyebilirsiniz.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard/children?enroll=1"
            className={buttonLinkClasses(
              "primary",
              "min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover",
            )}
          >
            Tekrar dene
          </Link>
          <Link href="/dashboard" className={buttonLinkClasses("outline", "min-h-[44px] w-full")}>
            Panele dön
          </Link>
        </div>
      </div>
    </section>
  );
}
