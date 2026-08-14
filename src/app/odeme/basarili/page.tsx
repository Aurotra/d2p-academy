import Link from "next/link";

import { buttonLinkClasses } from "@/presentation/components/ui/button";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string; studentId?: string }>;
}) {
  const query = await searchParams;
  const enrollmentId = query.enrollmentId?.trim() ?? "";
  const studentId = query.studentId?.trim() ?? "";

  const formsHref =
    enrollmentId && studentId
      ? `/dashboard/children/${studentId}/enrollments/${enrollmentId}/forms`
      : "/dashboard/children";

  return (
    <section className="bg-surface-section px-4 py-16 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-lg rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Ödeme alındı</p>
        <h1 className="mt-3 text-3xl font-black">Kayıt tamamlandı</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-on-surface-soft)]">
          Ödemeniz başarıyla alındı. Şimdi tanışma ve onay formlarını doldurarak kaydı tamamlayın.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={formsHref}
            className={buttonLinkClasses(
              "primary",
              "min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover",
            )}
          >
            Formlara devam et
          </Link>
          <Link href="/dashboard/children" className={buttonLinkClasses("outline", "min-h-[44px] w-full")}>
            Çocuklarım
          </Link>
        </div>
      </div>
    </section>
  );
}
