import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { SupabaseAdminInstructorRepository } from "@/infrastructure/repositories/supabase-admin-instructor-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminInstructorsManager } from "@/presentation/components/admin/admin-instructors-manager";

export const dynamic = "force-dynamic";

export default async function AdminInstructorsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const access = await getAdminAccess(client);
  if (!access.authorized) {
    redirect("/login");
  }

  const repository = new SupabaseAdminInstructorRepository(client);
  const instructors = await repository.listAll();
  const activeCount = instructors.filter((instructor) => instructor.isActive).length;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Eğitmen Yönetimi
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Eğitmenler</h1>
        <p className="mt-2 text-sm text-slate-600">
          Eğitmenleri buradan yönetin. Yeni eğitmen eklemek için{" "}
          <strong>Veliler ve Üyeler</strong> listesinden mevcut bir hesaba eğitmen yetkisi verin;
          ardından etkinlik düzenlerken eğitmen atayın. Yetkiyi kaldırmak için listedeki{" "}
          <strong>Yetkiyi geri al</strong> butonunu kullanın.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Toplam: {instructors.length}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
            Aktif: {activeCount}
          </span>
        </div>
      </div>

      <AdminInstructorsManager initialInstructors={instructors} />
    </div>
  );
}
