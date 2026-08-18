import { redirect } from "next/navigation";

import { PaymentSuccessWaiter } from "@/presentation/components/payments/payment-success-waiter";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { parentEnrollmentFormsPath } from "@/shared/utils/parent-enrollment-forms-path";

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

  if (!waitingForNotification) {
    redirect(parentEnrollmentFormsPath(studentId, enrollmentId));
  }

  return (
    <section className="bg-surface-section px-4 py-16 sm:px-6 lg:px-8">
      <div
        className={`mx-auto max-w-lg rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Ödeme alındı
        </p>
        <h1 className="mt-3 text-3xl font-black">Formlara yönlendiriliyorsunuz</h1>
        <PaymentSuccessWaiter paymentId={paymentId} />
      </div>
    </section>
  );
}
