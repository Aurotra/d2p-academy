import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceStatus,
  EventAttendanceSheet,
  UpsertAttendanceInput,
} from "@/core/domain/event-attendance";
import { formatStudentContact } from "@/shared/utils/format-student-contact";
import { formatEventSessionLabel } from "@/shared/utils/event-session-labels";

interface EventRow {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  required_lesson_count: number | null;
}

interface SessionRow {
  id: string;
  session_index: number;
  starts_at: string;
  ends_at: string;
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

interface SessionAttendanceRow {
  enrollment_id: string;
  session_id: string;
  status: AttendanceStatus;
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
      .select("id, title, start_at, end_at, required_lesson_count")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return null;
    }

    const eventRow = event as EventRow;

    const { data: sessionRows, error: sessionsError } = await this.client
      .from("event_sessions")
      .select("id, session_index, starts_at, ends_at")
      .eq("event_id", eventId)
      .order("session_index", { ascending: true });

    if (sessionsError) {
      throw new Error(`Ders çizelgesi alınamadı: ${sessionsError.message}`);
    }

    const sessions = (sessionRows ?? []) as SessionRow[];
    const totalLessonCount = sessions.length;
    const requiredLessonCount = Math.min(
      eventRow.required_lesson_count ?? totalLessonCount,
      totalLessonCount,
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
    const sessionIds = sessions.map((row) => row.id);

    const attendanceByEnrollment = new Map<string, Record<string, AttendanceStatus | null>>();

    for (const row of enrollmentRows) {
      const map: Record<string, AttendanceStatus | null> = {};
      for (const session of sessions) {
        map[session.id] = null;
      }
      attendanceByEnrollment.set(row.id, map);
    }

    if (enrollmentIds.length > 0 && sessionIds.length > 0) {
      const { data: attendanceRows, error: attendanceError } = await this.client
        .from("enrollment_session_attendance")
        .select("enrollment_id, session_id, status")
        .in("enrollment_id", enrollmentIds)
        .in("session_id", sessionIds);

      if (attendanceError) {
        throw new Error(`Yoklama kayıtları alınamadı: ${attendanceError.message}`);
      }

      for (const row of (attendanceRows ?? []) as SessionAttendanceRow[]) {
        const map = attendanceByEnrollment.get(row.enrollment_id);
        if (map && row.session_id in map) {
          map[row.session_id] = row.status;
        }
      }
    }

    return {
      eventId: eventRow.id,
      eventTitle: eventRow.title,
      startAt: eventRow.start_at,
      endAt: eventRow.end_at,
      sessions: sessions.map((session) => ({
        id: session.id,
        sessionIndex: session.session_index,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
        label: formatEventSessionLabel(session.starts_at, session.ends_at),
      })),
      requiredLessonCount,
      totalLessonCount,
      students: enrollmentRows.map((row) => {
        const profile = unwrapOne(row.profiles);
        const attendance = attendanceByEnrollment.get(row.id) ?? {};
        const presentCount = Object.values(attendance).filter((status) => status === "present")
          .length;

        return {
          enrollmentId: row.id,
          studentId: profile?.id ?? row.user_id,
          studentName: profile?.full_name ?? "Öğrenci",
          studentContact: formatStudentContact(profile?.email, profile?.username),
          enrollmentStatus: row.status,
          attendance,
          presentCount,
          attendanceComplete: totalLessonCount > 0 && presentCount >= requiredLessonCount,
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
    const { data: session, error: sessionError } = await this.client
      .from("event_sessions")
      .select("id, event_id")
      .eq("id", input.sessionId)
      .maybeSingle();

    if (sessionError || !session || session.event_id !== eventId) {
      throw new Error("Bu ders bu etkinliğe ait değil.");
    }

    const { data: enrollment, error: enrollmentError } = await this.client
      .from("enrollments")
      .select("id, event_id")
      .eq("id", input.enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment || enrollment.event_id !== eventId) {
      throw new Error("Kayıt bu etkinliğe ait değil.");
    }

    const { error } = await this.client.from("enrollment_session_attendance").upsert(
      {
        enrollment_id: input.enrollmentId,
        session_id: input.sessionId,
        status: input.status,
        notes: input.notes?.trim() || null,
        marked_by: actorId,
        marked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,session_id" },
    );

    if (error) {
      throw new Error(`Yoklama kaydedilemedi: ${error.message}`);
    }

    const { error: unlockError } = await this.client.rpc("maybe_unlock_enrollment_post_test", {
      p_enrollment_id: input.enrollmentId,
    });

    if (unlockError) {
      throw new Error(`Son test kilidi güncellenemedi: ${unlockError.message}`);
    }
  }
}
