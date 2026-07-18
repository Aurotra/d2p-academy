import { NextResponse } from "next/server";

import type { AdminAuditAction } from "@/core/domain/admin-audit-log";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/repositories/supabase-admin-audit-log-repository";

export async function GET(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get("action");
    const action =
      actionParam === "enrollment_deleted" || actionParam === "certificate_revoked"
        ? (actionParam as AdminAuditAction)
        : undefined;

    const repository = new SupabaseAdminAuditLogRepository(access.client);
    const logs = await repository.list(150, action);

    return NextResponse.json({
      data: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loglar alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
