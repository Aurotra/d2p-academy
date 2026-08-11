import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { SupabaseAdminParentRepository } from "@/infrastructure/repositories/supabase-admin-parent-repository";
import { AdminParentsFilters } from "@/presentation/components/admin/admin-parents-filters";
import { AdminParentsTable } from "@/presentation/components/admin/admin-parents-table";

export const dynamic = "force-dynamic";

interface AdminParentsPageProps {
  searchParams: Promise<{ q?: string; phone?: string }>;
}

export default async function AdminParentsPage({ searchParams }: AdminParentsPageProps) {
  const params = await searchParams;

  try {
    const dataClient = await getAdminDataClient();
    const repository = new SupabaseAdminParentRepository(dataClient);
    let parents = await repository.listParents({ query: params.q });
    const withPhone = parents.filter((parent) => Boolean(parent.contactPhone)).length;
    const stats = {
      total: parents.length,
      withPhone,
      missing: parents.length - withPhone,
    };

    if (params.phone === "with") {
      parents = parents.filter((parent) => Boolean(parent.contactPhone));
    } else if (params.phone === "missing") {
      parents = parents.filter((parent) => !parent.contactPhone);
    }

    return (
      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Veli İletişim
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy-950">Veli Telefon Rehberi</h1>
          <p className="mt-2 text-sm text-muted">
            Kayıtlı velilerin iletişim bilgileri. En son kayıt olan veliler listenin üstünde
            görünür. Veli adı, çocuk adı veya telefon ile arama yapabilirsiniz. Telefon önce veli
            hesabından, yoksa çocuk profilindeki veli telefonundan alınır.
          </p>
        </div>

        <Suspense fallback={null}>
          <AdminParentsFilters />
        </Suspense>

        <Suspense fallback={<p className="text-sm text-muted">Veli listesi yükleniyor…</p>}>
          <AdminParentsTable parents={parents} stats={stats} />
        </Suspense>
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
