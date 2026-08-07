import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { SupabaseAdminParentRepository } from "@/infrastructure/repositories/supabase-admin-parent-repository";
import { AdminParentsFilters } from "@/presentation/components/admin/admin-parents-filters";
import { AdminParentsTable } from "@/presentation/components/admin/admin-parents-table";

export const dynamic = "force-dynamic";

interface AdminParentsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminParentsPage({ searchParams }: AdminParentsPageProps) {
  const params = await searchParams;

  try {
    const dataClient = await getAdminDataClient();
    const repository = new SupabaseAdminParentRepository(dataClient);
    const parents = await repository.listParents({ query: params.q });

    return (
      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Veli İletişim
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Veli Telefon Rehberi</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kayıtlı velilerin adı, e-postası ve telefon bilgileri. İletişim telefonu önce veli
            hesabındaki numarayı, yoksa çocuk profilindeki veli telefonunu gösterir.
          </p>
        </div>

        <Suspense fallback={null}>
          <AdminParentsFilters />
        </Suspense>

        <AdminParentsTable parents={parents} />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Veli listesi yüklenemedi.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      redirect("/admin");
    }
    throw error;
  }
}
