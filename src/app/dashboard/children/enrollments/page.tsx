import Link from "next/link";
import { redirect } from "next/navigation";

import { fetchParentChildrenEnrollments } from "@/infrastructure/repositories/fetch-parent-children-enrollments";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { ParentChildrenEnrollmentsView } from "@/presentation/components/dashboard/parent-children-enrollments-view";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export const dynamic = "force-dynamic";

export default async function ParentChildrenEnrollmentsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    redirect("/login?redirectTo=/dashboard/children/enrollments");
  }

  let data: Awaited<ReturnType<typeof fetchParentChildrenEnrollments>> = {
    childrenCount: 0,
    enrollments: [],
  };
  let loadError: string | null = null;

  try {
    data = await fetchParentChildrenEnrollments(auth.user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Etkinlik kayıtları yüklenemedi.";
    console.error("[dashboard/children/enrollments]", error);
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
          <h1 className="mt-3 text-3xl font-black">Çocuklarımın Etkinlikleri</h1>
          <p className="mt-2 text-sm text-[var(--text-on-surface-soft)]">
            Tüm çocuk hesaplarınızın etkinlik kayıtlarını, form ilerlemesini ve yoklama
            durumunu tek yerden takip edin.
          </p>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-border-surface bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Etkinlik kayıtları</h2>
              <p className="mt-1 text-sm text-subtle">
                {data.childrenCount} çocuk · {data.enrollments.length} kayıt
              </p>
            </div>
            <Link
              href="/dashboard/children"
              className="inline-flex rounded-xl border border-border-surface bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-surface-section"
            >
              Çocuk hesapları
            </Link>
            <Link
              href="/dashboard/payments"
              className="inline-flex rounded-xl border border-border-surface bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-surface-section"
            >
              Ödemelerim
            </Link>
          </div>

          {loadError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </p>
          ) : (
            <ParentChildrenEnrollmentsView
              enrollments={data.enrollments}
              childrenCount={data.childrenCount}
            />
          )}
        </div>
      </div>
    </section>
  );
}
