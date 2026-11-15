import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { mapStoreOrderRow, type StoreOrderRow } from "@/infrastructure/store/map-store-order";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { AdminStoreOrdersManager } from "@/presentation/components/admin/admin-store-orders-manager";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ order?: string; status?: string }>;
}

export default async function AdminStoreOrdersPage({ searchParams }: PageProps) {
  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const adminAccess = await getAdminAccess(client);
  if (!adminAccess.authorized) {
    redirect("/login");
  }

  const params = await searchParams;
  let query = client
    .from("store_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.order) {
    query = query.ilike("order_number", `%${params.order}%`);
  }

  const { data } = await query;
  const orders = ((data ?? []) as StoreOrderRow[]).map((row) => mapStoreOrderRow(row));

  return (
    <AdminStoreOrdersManager
      initialOrders={orders}
      highlightOrderNumber={params.order?.trim() || undefined}
    />
  );
}
