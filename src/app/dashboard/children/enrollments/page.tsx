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

  const data = await fetchParentChildrenEnrollments(auth.user.id);

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div
          className={`rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950 shadow-xl`}
        >
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-sky-800 transition hover:text-sky-950"
          >
            ← Panele dön
          </Link>
          <h1 className="mt-3 text-3xl font-black">Çocuklarımın Etkinlikleri</h1>
          <p className="mt-2 text-sm text-sky-900/80">
            Tüm çocuk hesaplarınızın etkinlik kayıtlarını, form ilerlemesini ve yoklama
            durumunu tek yerden takip edin.
          </p>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-950">Etkinlik kayıtları</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.childrenCount} çocuk · {data.enrollments.length} kayıt
              </p>
            </div>
            <Link
              href="/dashboard/children"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-slate-50"
            >
              Çocuk hesapları
            </Link>
          </div>

          <ParentChildrenEnrollmentsView
            enrollments={data.enrollments}
            childrenCount={data.childrenCount}
          />
        </div>
      </div>
    </section>
  );
}
