import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchParentPayments } from "@/infrastructure/repositories/fetch-parent-payments";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { ParentPaymentsView } from "@/presentation/components/dashboard/parent-payments-view";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export const dynamic = "force-dynamic";

export default async function ParentPaymentsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect("/login?redirectTo=/dashboard/payments");
  }

  let payments: Awaited<ReturnType<typeof fetchParentPayments>> = [];
  let loadError: string | null = null;
  try {
    payments = await fetchParentPayments(supabase, auth.user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Ödemeler yüklenemedi.";
    console.error("[dashboard/payments]", error);
  }

  return (
    <section className="bg-surface-section px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div
          className={`rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950 shadow-xl`}
        >
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-navy-900 transition hover:text-navy-950"
          >
            ← Panele dön
          </Link>
          <h1 className="mt-3 text-3xl font-black">Ödemelerim</h1>
          <p className="mt-2 text-sm text-[var(--text-on-surface-soft)]">
            Çocuklarınız adına yaptığınız etkinlik ödemelerinin listesi. İade veya iptal için
            bizimle iletişime geçin.
          </p>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-border-surface bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy-950">Ödeme geçmişi</h2>
            <p className="mt-1 text-sm text-subtle">
              En fazla 50 kayıt · yalnızca kendi ödemeleriniz
            </p>
          </div>

          {loadError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </p>
          ) : (
            <ParentPaymentsView payments={payments} />
          )}
        </div>
      </div>
    </section>
  );
}
