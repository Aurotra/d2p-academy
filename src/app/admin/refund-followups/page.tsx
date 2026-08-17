import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getAdminDataClient } from "@/infrastructure/auth/get-admin-data-client";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  AdminRefundFollowupsManager,
  type RefundFollowupRow,
  type RefundFollowupStatus,
} from "@/presentation/components/admin/admin-refund-followups-manager";

export const dynamic = "force-dynamic";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminRefundFollowupsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) {
    redirect("/login");
  }

  const access = await getAdminAccess(sessionClient);
  if (!access.authorized) {
    redirect("/login");
  }

  const params = await searchParams;
  const statusParam = params.status;
  const statusFilter: RefundFollowupStatus | "all" =
    statusParam === "all" ||
    statusParam === "refunded_manual" ||
    statusParam === "waived" ||
    statusParam === "open"
      ? statusParam
      : "open";

  const client = await getAdminDataClient();

  let query = client
    .from("refund_followups")
    .select(
      `
      id,
      amount_try_cents,
      provider_payment_id,
      provider,
      cancelled_at,
      reason,
      status,
      note,
      events ( title ),
      student:profiles!refund_followups_student_id_fkey ( full_name, email ),
      cancelled_by_profile:profiles!refund_followups_cancelled_by_fkey ( email )
    `,
    )
    .order("cancelled_at", { ascending: false })
    .limit(100);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/refund-followups page]", error);
  }

  const rows: RefundFollowupRow[] = (data ?? []).map((row) => {
    const event = unwrapOne(row.events as { title?: string } | { title?: string }[] | null);
    const student = unwrapOne(
      row.student as
        | { full_name?: string; email?: string | null }
        | { full_name?: string; email?: string | null }[]
        | null,
    );
    const cancelledBy = unwrapOne(
      row.cancelled_by_profile as { email?: string | null } | { email?: string | null }[] | null,
    );

    return {
      id: row.id as string,
      eventTitle: event?.title ?? null,
      studentName: student?.full_name ?? null,
      studentEmail: student?.email ?? null,
      amountTryCents: row.amount_try_cents as number,
      providerPaymentId: (row.provider_payment_id as string | null) ?? null,
      provider: (row.provider as string) ?? "iyzico",
      cancelledAt: row.cancelled_at as string,
      cancelledByEmail: cancelledBy?.email ?? null,
      reason: (row.reason as string | null) ?? null,
      status: row.status as RefundFollowupStatus,
      note: (row.note as string | null) ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Finans
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-950">Bekleyen İadeler</h1>
        <p className="mt-2 text-sm text-muted">
          Ücretli kaydı iptal/çıkarma sonrası otomatik iade yok. PayTR panelinden manuel iade
          yaptıktan sonra satırı çözün; iade gerekmiyorsa vazgeçildi olarak işaretleyin.
        </p>
      </div>

      <AdminRefundFollowupsManager initialRows={rows} initialStatus={statusFilter} />
    </div>
  );
}
