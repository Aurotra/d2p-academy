import type { SupabaseClient } from "@supabase/supabase-js";

import type { CourseDemandRequest, CourseDemandStatus } from "@/core/domain/course-demand";

type DemandRow = {
  id: string;
  submitted_by_profile_id: string | null;
  student_profile_id: string | null;
  student_name: string | null;
  program_code: string;
  preferred_start_date: string;
  preferred_end_date: string | null;
  status: string;
  grouped_event_id: string | null;
  notes: string | null;
  created_at: string;
  parent?: { full_name: string; email: string | null; phone: string | null } | Array<{
    full_name: string;
    email: string | null;
    phone: string | null;
  }> | null;
  student?: { full_name: string } | Array<{ full_name: string }> | null;
  grouped_event?: { title: string } | Array<{ title: string }> | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function mapCourseDemandRow(row: DemandRow): CourseDemandRequest {
  const parent = first(row.parent);
  const student = first(row.student);
  const groupedEvent = first(row.grouped_event);
  const studentName = row.student_name ?? student?.full_name ?? null;

  return {
    id: row.id,
    submittedByProfileId: row.submitted_by_profile_id,
    studentProfileId: row.student_profile_id,
    studentName,
    programCode: row.program_code,
    preferredStartDate: row.preferred_start_date,
    preferredEndDate: row.preferred_end_date,
    status: row.status as CourseDemandStatus,
    groupedEventId: row.grouped_event_id,
    groupedEventTitle: groupedEvent?.title ?? null,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    parentName: parent?.full_name ?? null,
    parentEmail: parent?.email ?? null,
    parentPhone: parent?.phone ?? null,
    needsStudentProfile: row.student_profile_id == null,
  };
}

const DEMAND_SELECT = `
  id,
  submitted_by_profile_id,
  student_profile_id,
  student_name,
  program_code,
  preferred_start_date,
  preferred_end_date,
  status,
  grouped_event_id,
  notes,
  created_at,
  parent:profiles!course_demand_requests_submitted_by_profile_id_fkey ( full_name, email, phone ),
  student:profiles!course_demand_requests_student_profile_id_fkey ( full_name ),
  grouped_event:events!course_demand_requests_grouped_event_id_fkey ( title )
`;

export async function listCourseDemandsForClient(
  client: SupabaseClient,
  options?: {
    programCode?: string;
    startDate?: string;
    endDate?: string;
    status?: CourseDemandStatus;
    admin?: boolean;
  },
): Promise<CourseDemandRequest[]> {
  let query = client.from("course_demand_requests").select(DEMAND_SELECT);

  if (options?.programCode) {
    query = query.eq("program_code", options.programCode.toUpperCase());
  }
  if (options?.startDate) {
    query = query.gte("preferred_start_date", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("preferred_start_date", options.endDate);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  query = query.order("program_code", { ascending: true }).order("preferred_start_date", {
    ascending: true,
  });

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data as DemandRow[]).map(mapCourseDemandRow);
}
