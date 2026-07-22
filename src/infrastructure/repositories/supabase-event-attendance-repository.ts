import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceStatus,
  EventAttendanceSheet,
  UpsertAttendanceInput,
} from "@/core/domain/event-attendance";
import { formatStudentContact } from "@/shared/utils/format-student-contact";
import { listEventAttendanceDates } from "@/shared/utils/event-attendance-dates";

interface EventRow {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  instructor_id: string | null;
}

interface EnrollmentRow {
  id: string;
  status: string;
  user_id: string;
  profiles:
    | { id: string; full_name: string; email: string | null; username: string | null }
    | { id: string; full_name: string; email: string | null; username: string | null }[]
    | null;
}

interface AttendanceRow {
  enrollment_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_at: string;
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export class SupabaseEventAttendanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getEventAttendanceSheet(
    eventId: string,
    options: { canEdit: boolean },
  ): Promise<EventAttendanceSheet | null> {
    const { data: event, error: eventError } = await this.client
      .from("events")
      .select("id, title, start_at, end_at, instructor_id")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return null;
    }

    const eventRow = event as EventRow;
    const dates = listEventAttendanceDates(
      new Date(eventRow.start_at),
      new Date(eventRow.end_at),
    );

    const { data: enrollments, error: enrollmentsError } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        status,
        user_id,
        profiles (
          id,
          full_name,
          email,
          username
        )
      `,
      )
      .eq("event_id", eventId)
      .neq("status", "cancelled")
      .order("registered_at", { ascending: true });

    if (enrollmentsError) {
      throw new Error(`Kayıtlar alınamadı: ${enrollmentsError.message}`);
    }

    const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
    const enrollmentIds = enrollmentRows.map((row) => row.id);

    const attendanceByEnrollment = new Map<string, Record<string, AttendanceStatus | null>>();

    for (const row of enrollmentRows) {
      const map: Record<string, AttendanceStatus | null> = {};
      for (const date of dates) {
        map[date] = null;
      }
      attendanceByEnrollment.set(row.id, map);
    }

    if (enrollmentIds.length > 0) {
      const { data: attendanceRows, error: attendanceError } = await this.client
        .from("enrollment_attendance")
        .select("enrollment_id, attendance_date, status, notes, marked_at")
        .in("enrollment_id", enrollmentIds);

      if (attendanceError) {
        throw new Error(`Yoklama kayıtları alınamadı: ${attendanceError.message}`);
      }

      for (const row of (attendanceRows ?? []) as AttendanceRow[]) {
        const map = attendanceByEnrollment.get(row.enrollment_id);
        if (map && row.attendance_date in map) {
          map[row.attendance_date] = row.status;
        }
      }
    }

    return {
      eventId: eventRow.id,
      eventTitle: eventRow.title,
      startAt: eventRow.start_at,
      endAt: eventRow.end_at,
      dates,
      students: enrollmentRows.map((row) => {
        const profile = unwrapOne(row.profiles);
        return {
          enrollmentId: row.id,
          studentId: profile?.id ?? row.user_id,
          studentName: profile?.full_name ?? "Öğrenci",
          studentContact: formatStudentContact(profile?.email, profile?.username),
          enrollmentStatus: row.status,
          attendance: attendanceByEnrollment.get(row.id) ?? {},
        };
      }),
      canEdit: options.canEdit,
    };
  }

  async upsertAttendance(
    eventId: string,
    actorId: string,
    input: UpsertAttendanceInput,
  ): Promise<void> {
    const dates = await this.getAllowedDatesForEnrollment(eventId, input.enrollmentId);
    if (!dates.includes(input.attendanceDate)) {
      throw new Error("Bu tarih etkinlik planı dışında.");
    }

    const { error } = await this.client.from("enrollment_attendance").upsert(
      {
        enrollment_id: input.enrollmentId,
        attendance_date: input.attendanceDate,
        status: input.status,
        notes: input.notes?.trim() || null,
        marked_by: actorId,
        marked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,attendance_date" },
    );

    if (error) {
      throw new Error(`Yoklama kaydedilemedi: ${error.message}`);
    }

    if (input.status === "present") {
      await this.client
        .from("enrollments")
        .update({ status: "attended", updated_at: new Date().toISOString() })
        .eq("id", input.enrollmentId)
        .eq("status", "registered");
    }
  }

  private async getAllowedDatesForEnrollment(
    eventId: string,
    enrollmentId: string,
  ): Promise<string[]> {
    const { data: enrollment, error: enrollmentError } = await this.client
      .from("enrollments")
      .select("event_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment || enrollment.event_id !== eventId) {
      throw new Error("Kayıt bu etkinliğe ait değil.");
    }

    const { data: event, error: eventError } = await this.client
      .from("events")
      .select("start_at, end_at")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new Error("Etkinlik bulunamadı.");
    }

    return listEventAttendanceDates(new Date(event.start_at), new Date(event.end_at));
  }
}
