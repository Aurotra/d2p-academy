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
    .select("id, payer_user_id, status, provider_raw")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.payer_user_id !== auth.user.id) {
    notFound();
  }

  if (payment.status === "paid") {
    redirect("/odeme/basarili");
  }

  const raw = (payment.provider_raw ?? {}) as { checkoutFormContent?: string };
  const html = raw.checkoutFormContent?.trim() ?? "";

  if (!html || query.embed !== "1") {
    redirect("/dashboard/children?enroll=1");
  }

  return (
    <section className="min-h-[70vh] bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black text-navy-950">Güvenli ödeme</h1>
        <p className="mt-2 text-sm text-muted">
          Ödemeyi iyzico güvenli formu üzerinden tamamlayın. İşlem bitince otomatik yönlendirilirsiniz.
        </p>
        <div
          className="mt-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
