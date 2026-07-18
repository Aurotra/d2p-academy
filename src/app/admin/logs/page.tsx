import { Suspense } from "react";

import { AdminAuditLogsView } from "@/presentation/components/admin/admin-audit-logs-view";

export const dynamic = "force-dynamic";

export default function AdminAuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loglar yükleniyor...
        </div>
      }
    >
      <AdminAuditLogsView />
    </Suspense>
  );
}
