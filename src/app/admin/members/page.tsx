import { Suspense } from "react";
import { redirect } from "next/navigation";

import type { AdminMemberRole } from "@/core/domain/admin-member";
import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { SupabaseAdminMemberRepository } from "@/infrastructure/repositories/supabase-admin-member-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminMembersFilters } from "@/presentation/components/admin/admin-members-filters";
import { AdminMembersTable } from "@/presentation/components/admin/admin-members-table";

export const dynamic = "force-dynamic";

interface AdminMembersPageProps {
  searchParams: Promise<{ q?: string; role?: string }>;
}

function parseRoleFilter(value: string | undefined): AdminMemberRole | "all" {
  if (value === "parent" || value === "student") {
    return value;
  }
  return "all";
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const params = await searchParams;
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);
  if (!access.authorized) {
    redirect("/login");
  }

  const repository = new SupabaseAdminMemberRepository(client);
  const members = await repository.listMembers({
    query: params.q,
    role: parseRoleFilter(params.role),
  });

  const parentCount = members.filter((member) => member.role === "parent").length;
  const studentCount = members.filter((member) => member.role === "student").length;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Üyelik
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Veliler ve Üyeler</h1>
        <p className="mt-2 text-sm text-slate-600">
          Siteye kayıt olan veli ve e-posta ile giriş yapan üye hesapları. Çocuk (kullanıcı adlı)
          hesaplar bu listede yer almaz. <strong>Eğitmen yap</strong> veya{" "}
          <strong>Yetkiyi geri al</strong> işlemlerini bu listeden yönetebilirsiniz. Eğitmen yetkisi
          verildiğinde veli/üye rolü korunur; kişi hem veli hem eğitmen panelini kullanabilir.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Toplam: {members.length}
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900">
            Veli: {parentCount}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">
            Üye öğrenci: {studentCount}
          </span>
        </div>
      </div>

      <Suspense fallback={null}>
        <AdminMembersFilters />
      </Suspense>

      <AdminMembersTable members={members} />
    </div>
  );
}
