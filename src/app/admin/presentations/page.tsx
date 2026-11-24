import { AdminPresentationsManager } from "@/presentation/components/admin/admin-presentations-manager";

export const dynamic = "force-dynamic";

export default function AdminPresentationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          İçerik
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy-950">Sunumlar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Eğitmen paneline atanacak PDF sunumlarını yükleyin. Dosyalar özel depoda tutulur;
          eğitmenler yalnızca imzalı erişimle tam ekran sunum yapabilir.
        </p>
      </div>
      <AdminPresentationsManager />
    </div>
  );
}
