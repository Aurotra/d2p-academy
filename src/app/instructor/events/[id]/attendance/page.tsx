import Link from "next/link";
import { redirect } from "next/navigation";

import { getEventAttendanceAccess } from "@/infrastructure/auth/get-event-attendance-access";
import { getInstructorAccess } from "@/infrastructure/auth/get-instructor-access";
import { SupabaseEventAttendanceRepository } from "@/infrastructure/repositories/supabase-event-attendance-repository";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { EventAttendanceSheetView } from "@/presentation/components/attendance/event-attendance-sheet";

export const dynamic = "force-dynamic";

interface InstructorAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function InstructorAttendancePage({ params }: InstructorAttendancePageProps) {
  const { id: eventId } = await params;
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login?redirectTo=/instructor");
  }

  const instructorAccess = await getInstructorAccess(client);
  if (!instructorAccess.authorized) {
    redirect("/login?redirectTo=/instructor");
  }

  const access = await getEventAttendanceAccess(client, eventId);
  if (!access.authorized || access.role !== "instructor") {
    redirect("/instructor");
  }

  const repository = new SupabaseEventAttendanceRepository(client);
  const sheet = await repository.getEventAttendanceSheet(eventId, { canEdit: true });

  if (!sheet) {
    redirect("/instructor");
  }

  return (
    <div className="space-y-4">
      <Link href="/instructor" className="text-sm font-semibold text-document-primary hover:underline">
        ← Etkinliklerim
      </Link>
      <EventAttendanceSheetView sheet={sheet} apiBasePath="/api/v1/events" />
    </div>
  );
}
