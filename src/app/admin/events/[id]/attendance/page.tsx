import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminAccess } from "@/infrastructure/auth/get-admin-access";
import { getEventAttendanceAccess } from "@/infrastructure/auth/get-event-attendance-access";
import { SupabaseEventAttendanceRepository } from "@/infrastructure/repositories/supabase-event-attendance-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventAttendanceSheetView } from "@/presentation/components/attendance/event-attendance-sheet";

export const dynamic = "force-dynamic";

interface AdminAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventAttendancePage({ params }: AdminAttendancePageProps) {
  const { id: eventId } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const adminAccess = await getAdminAccess(client);
  if (!adminAccess.authorized) {
    redirect("/login");
  }

  const access = await getEventAttendanceAccess(client, eventId);
  if (!access.authorized) {
    redirect("/admin/events");
  }

  const repository = new SupabaseEventAttendanceRepository(client);
  const sheet = await repository.getEventAttendanceSheet(eventId, { canEdit: true });

  if (!sheet) {
    redirect("/admin/events");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/events" className="text-sm font-semibold text-document-primary hover:underline">
          ← Etkinlikler
        </Link>
        <Link
          href={`/admin/enrollments?event_id=${eventId}`}
          className="text-sm font-semibold text-document-primary hover:underline"
        >
          Kayıtlar
        </Link>
      </div>
      <EventAttendanceSheetView sheet={sheet} apiBasePath="/api/v1/events" />
    </div>
  );
}
