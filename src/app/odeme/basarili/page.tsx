import Link from "next/link";
import { redirect } from "next/navigation";

import { PaymentSuccessWaiter } from "@/presentation/components/payments/payment-success-waiter";
import { buttonLinkClasses } from "@/presentation/components/ui/button";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string; studentId?: string; paymentId?: string }>;
}) {
  const query = await searchParams;
  let enrollmentId = query.enrollmentId?.trim() ?? "";
  let studentId = query.studentId?.trim() ?? "";
  const paymentId = query.paymentId?.trim() ?? "";
  let waitingForNotification = false;

  if (paymentId && (!enrollmentId || !studentId)) {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!auth?.user) {
      redirect(`/login?redirectTo=${encodeURIComponent(`/odeme/basarili?paymentId=${paymentId}`)}`);
    }

    try {
      const serviceClient = createServiceRoleClient();
      const { data: payment } = await serviceClient
        .from("payments")
        .select("status, enrollment_id, student_user_id, payer_user_id")
        .eq("id", paymentId)
        .maybeSingle();

      if (payment?.payer_user_id === auth.user.id) {
        if (payment.status === "failed" || payment.status === "cancelled") {
          redirect(`/odeme/basarisiz?paymentId=${encodeURIComponent(paymentId)}`);
        }
        if (payment.status === "paid") {
          enrollmentId = payment.enrollment_id;
          studentId = payment.student_user_id;
        } else {
          waitingForNotification = true;
        }
      }
    } catch {
      waitingForNotification = true;
    }
  }

  const formsHref =
    enrollmentId && studentId
      ? `/dashboard/children/${studentId}/enrollments/${enrollmentId}/forms`
      : "/dashboard/children";

  return (
    <section className="bg-surface-section px-4 py-16 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-lg rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
      >
        {waitingForNotification ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Ödeme alındı
            </p>
            <h1 className="mt-3 text-3xl font-black">Kayıt doğrulanıyor</h1>
            <PaymentSuccessWaiter paymentId={paymentId} />
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Ödeme alındı
            </p>
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
          </>
        )}
      </div>
    </section>
  );
}
