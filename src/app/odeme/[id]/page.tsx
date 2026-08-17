import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export default async function PaymentEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { id: paymentId } = await params;
  const query = await searchParams;

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
          <iframe
            title="PayTR güvenli ödeme"
            src={iframeUrl}
            className="mt-6 min-h-[720px] w-full rounded-2xl border border-border-surface"
          />
        ) : (
          <div className="mt-6" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </section>
  );
}
