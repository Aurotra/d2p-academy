import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { rotatePendingPaytrCheckout } from "@/infrastructure/payments/start-paid-enrollment-checkout";
import { shouldRotatePaytrCheckout } from "@/infrastructure/payments/paytr-session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { PaytrCheckoutFrame } from "@/presentation/components/payments/paytr-checkout-frame";
import { PaytrInstallmentTable } from "@/presentation/components/payments/paytr-installment-table";
import { getPaytrInstallmentTableScriptUrl } from "@/infrastructure/payments/paytr-hash";
import { CSP_NONCE_HEADER } from "@/shared/config/csp-nonce";

export default async function PaymentEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string; fresh?: string }>;
}) {
  const { id: paymentId } = await params;
  const query = await searchParams;
  const headerStore = await headers();
  const nonce = headerStore.get(CSP_NONCE_HEADER) ?? undefined;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/odeme/${paymentId}`)}`);
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    notFound();
  }

  const { data: payment } = await serviceClient
    .from("payments")
    .select(
      "id, payer_user_id, student_user_id, event_id, enrollment_id, amount_try_cents, status, provider, provider_raw, created_at",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.payer_user_id !== auth.user.id) {
    notFound();
  }

  if (payment.status === "paid") {
    redirect(`/odeme/basarili?paymentId=${encodeURIComponent(paymentId)}`);
  }

  const enrollHref = payment.event_id
    ? `/dashboard/children?enroll=1&eventId=${encodeURIComponent(payment.event_id)}`
    : "/dashboard/children?enroll=1";

  if (payment.status === "failed" || payment.status === "cancelled") {
    redirect(enrollHref);
  }

  if (
    shouldRotatePaytrCheckout({
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.created_at,
      isFreshLoad: query.fresh === "1",
    })
  ) {
    let rotated: { paymentPageUrl: string };
    try {
      rotated = await rotatePendingPaytrCheckout({
        serviceClient,
        request: new Request("https://www.d2p.com.tr/odeme", { headers: headerStore }),
        payment: {
          id: payment.id,
          enrollmentId: payment.enrollment_id,
          eventId: payment.event_id,
          studentUserId: payment.student_user_id,
          payerUserId: payment.payer_user_id,
          amountTryCents: payment.amount_try_cents,
        },
      });
    } catch (error) {
      console.error("[odeme rotate paytr]", error);
      redirect(enrollHref);
    }
    redirect(rotated.paymentPageUrl);
  }

  const raw = (payment.provider_raw ?? {}) as {
    checkoutFormContent?: string;
    iframeUrl?: string;
  };
  const iframeUrl = raw.iframeUrl?.trim() ?? "";
  const html = raw.checkoutFormContent?.trim() ?? "";
  const installmentScriptUrl = getPaytrInstallmentTableScriptUrl(payment.amount_try_cents ?? 0);

  if (query.embed !== "1" || (!iframeUrl && !html)) {
    redirect(enrollHref);
  }

  return (
    <section className="min-h-[70vh] bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black text-navy-950">Güvenli ödeme</h1>
        <p className="mt-2 text-sm text-muted">
          Ödemeyi güvenli ödeme formu üzerinden tamamlayın. Kartınız uygunsa taksit seçenekleri
          formda görünür. İşlem bitince otomatik yönlendirilirsiniz.
        </p>
        {iframeUrl ? (
          <PaytrCheckoutFrame iframeUrl={iframeUrl} nonce={nonce} enrollHref={enrollHref} />
        ) : (
          <div className="mt-6" dangerouslySetInnerHTML={{ __html: html }} />
        )}
        {installmentScriptUrl ? (
          <PaytrInstallmentTable scriptUrl={installmentScriptUrl} nonce={nonce} />
        ) : null}
      </div>
    </section>
  );
}
