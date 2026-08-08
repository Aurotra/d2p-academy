import { Suspense } from "react";

import { AdminAuditLogsView } from "@/presentation/components/admin/admin-audit-logs-view";

export const dynamic = "force-dynamic";

export default function AdminAuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[2rem] border border-border-surface bg-white p-6 text-sm text-muted">
          Loglar yükleniyor...
        </div>
      }
    >
      <AdminAuditLogsView />
    </Suspense>
  );
}
