import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { PaytrCheckoutFrame } from "@/presentation/components/payments/paytr-checkout-frame";
import { CSP_NONCE_HEADER } from "@/shared/config/csp-nonce";

export default async function PaymentEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { id: paymentId } = await params;
  const query = await searchParams;
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

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
    .select("id, payer_user_id, status, provider, provider_raw")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.payer_user_id !== auth.user.id) {
    notFound();
  }

  if (payment.status === "paid") {
    redirect(`/odeme/basarili?paymentId=${encodeURIComponent(paymentId)}`);
  }

  const raw = (payment.provider_raw ?? {}) as {
    checkoutFormContent?: string;
    iframeUrl?: string;
  };
  const iframeUrl = raw.iframeUrl?.trim() ?? "";
  const html = raw.checkoutFormContent?.trim() ?? "";

  if (query.embed !== "1" || (!iframeUrl && !html)) {
    redirect("/dashboard/children?enroll=1");
  }

  return (
    <section className="min-h-[70vh] bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black text-navy-950">Güvenli ödeme</h1>
        <p className="mt-2 text-sm text-muted">
          Ödemeyi güvenli ödeme formu üzerinden tamamlayın. İşlem bitince otomatik
          yönlendirilirsiniz.
        </p>
        {iframeUrl ? (
          <PaytrCheckoutFrame
            iframeUrl={iframeUrl}
            nonce={nonce}
          />
        ) : (
          <div className="mt-6" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
