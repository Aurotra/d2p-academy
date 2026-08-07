import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AttendanceStatus,
  EventAttendanceSheet,
  SubmitSessionAttendanceInput,
  SubmitSessionAttendanceResult,
  UpsertAttendanceInput,
  UpsertAttendanceResult,
} from "@/core/domain/event-attendance";
import { formatStudentContact } from "@/shared/utils/format-student-contact";
import { formatEventLessonLabel } from "@/shared/utils/event-session-labels";
import {
  isEnrollmentAttendanceComplete,
  resolveRequiredLessonCount,
} from "@/shared/utils/enrollment-attendance";
import { isEventAttendanceOpen } from "@/shared/utils/event-attendance-window";
import { normalizeTotalLessonCount } from "@/shared/utils/event-lesson-schedule";
import { isStudentParticipantProfile } from "@/shared/utils/student-participant-profile";
import { ACTIVE_ENROLLMENT_STATUSES, isActiveEnrollmentStatus } from "@/shared/constants/enrollment-status";

interface EventRow {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  required_lesson_count: number | null;
  total_lesson_count: number | null;
}

interface SessionRow {
  id: string;
  session_index: number;
  starts_at: string;
  ends_at: string;
  attendance_submitted_at: string | null;
}

interface EnrollmentRow {
  id: string;
  status: string;
  user_id: string;
  profiles:
    | { id: string; full_name: string; email: string | null; username: string | null; role: string }
    | { id: string; full_name: string; email: string | null; username: string | null; role: string }[]
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
    options: { canEdit: boolean; canEditLockedSessions?: boolean },
  ): Promise<EventAttendanceSheet | null> {
    const { data: event, error: eventError } = await this.client
      .from("events")
      .select("id, title, start_at, end_at, required_lesson_count, total_lesson_count")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return null;
    }

    const eventRow = event as EventRow;

    const { data: sessionRows, error: sessionsError } = await this.client
      .from("event_sessions")
      .select("id, session_index, starts_at, ends_at, attendance_submitted_at")
      .eq("event_id", eventId)
      .order("session_index", { ascending: true });

    if (sessionsError) {
      throw new Error(`Ders çizelgesi alınamadı: ${sessionsError.message}`);
    }

    const totalLessonCount = normalizeTotalLessonCount(eventRow.total_lesson_count);
    const sessions = ((sessionRows ?? []) as SessionRow[])
      .filter((session) => session.session_index <= totalLessonCount)
      .slice(0, totalLessonCount);
    const requiredLessonCount = resolveRequiredLessonCount(eventRow.required_lesson_count);

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
          username,
          role
        )
      `,
      )
      .eq("event_id", eventId)
      .in("status", [...ACTIVE_ENROLLMENT_STATUSES])
      .order("registered_at", { ascending: true });

    if (enrollmentsError) {
      throw new Error(`Kayıtlar alınamadı: ${enrollmentsError.message}`);
    }

    const enrollmentRows = ((enrollments ?? []) as EnrollmentRow[]).filter((row) => {
      const profile = unwrapOne(row.profiles);
      return profile ? isStudentParticipantProfile(profile) : false;
    });
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

    const attendanceOpen = isEventAttendanceOpen(eventRow.start_at, eventRow.end_at);

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
        label: formatEventLessonLabel(session.session_index),
        attendanceSubmittedAt: session.attendance_submitted_at,
        attendanceLocked: session.attendance_submitted_at != null,
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
          attendanceComplete: isEnrollmentAttendanceComplete(
            presentCount,
            eventRow.required_lesson_count,
          ),
        };
      }),
      canEdit: options.canEdit,
      attendanceOpen,
      canEditLockedSessions: options.canEditLockedSessions ?? false,
    };
  }

  private async assertSessionEditable(
    sessionId: string,
    eventId: string,
    allowLocked: boolean,
  ): Promise<{ session_index: number; attendance_submitted_at: string | null }> {
    const { data: session, error: sessionError } = await this.client
      .from("event_sessions")
      .select("id, event_id, session_index, attendance_submitted_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session || session.event_id !== eventId) {
      throw new Error("Bu ders bu etkinliğe ait değil.");
    }

    if (session.attendance_submitted_at && !allowLocked) {
      throw new Error("Bu ders yoklaması onaylandı ve kilitlendi.");
    }

    return session;
  }

  async upsertAttendance(
    eventId: string,
    actorId: string,
    input: UpsertAttendanceInput,
    options: { allowLockedSession?: boolean } = {},
  ): Promise<UpsertAttendanceResult> {
    const { data: event, error: eventError } = await this.client
      .from("events")
      .select("title, start_at, end_at, total_lesson_count")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new Error("Etkinlik bulunamadı.");
    }

    const outsideEventWindow = !isEventAttendanceOpen(event.start_at, event.end_at);

    const session = await this.assertSessionEditable(
      input.sessionId,
      eventId,
      options.allowLockedSession ?? false,
    );

    const totalLessonCount = normalizeTotalLessonCount(
      (event as { total_lesson_count?: number | null }).total_lesson_count,
    );
    if (session.session_index > totalLessonCount) {
      throw new Error("Bu ders yoklama kapsamı dışında.");
    }

    const { data: enrollment, error: enrollmentError } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        event_id,
        user_id,
        status,
        profiles (
          id,
          full_name,
          email
        )
      `,
      )
      .eq("id", input.enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment || enrollment.event_id !== eventId) {
      throw new Error("Kayıt bu etkinliğe ait değil.");
    }

    if (!isActiveEnrollmentStatus(enrollment.status)) {
      throw new Error("Bu öğrenci etkinlikten çıkarıldığı için yoklama işaretlenemez.");
    }

    const { data: existingAttendance } = await this.client
      .from("enrollment_session_attendance")
      .select("status")
      .eq("enrollment_id", input.enrollmentId)
      .eq("session_id", input.sessionId)
      .maybeSingle();

    const previousStatus = (existingAttendance?.status as AttendanceStatus | undefined) ?? null;
    const profile = unwrapOne(
      enrollment.profiles as
        | { id: string; full_name: string; email: string | null }
        | { id: string; full_name: string; email: string | null }[]
        | null,
    );

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

    return {
      eventTitle: event.title,
      studentId: profile?.id ?? enrollment.user_id,
      studentName: profile?.full_name ?? "Öğrenci",
      studentEmail: profile?.email ?? null,
      sessionLabel: formatEventLessonLabel(session.session_index),
      previousStatus,
      status: input.status,
      outsideEventWindow,
    };
  }

  async submitSessionAttendance(
    eventId: string,
    actorId: string,
    input: SubmitSessionAttendanceInput,
    options: { allowLockedSession?: boolean } = {},
  ): Promise<SubmitSessionAttendanceResult> {
    const { data: event, error: eventError } = await this.client
      .from("events")
      .select("title, start_at, end_at, total_lesson_count")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new Error("Etkinlik bulunamadı.");
    }

    const session = await this.assertSessionEditable(
      input.sessionId,
      eventId,
      options.allowLockedSession ?? false,
    );

    const alreadySubmitted = Boolean(session.attendance_submitted_at);
    if (alreadySubmitted && !options.allowLockedSession) {
      throw new Error("Bu ders yoklaması zaten onaylanmış.");
    }

    const { data: enrollments, error: enrollmentsError } = await this.client
      .from("enrollments")
      .select(
        `
        id,
        profiles (
          id,
          role
        )
      `,
      )
      .eq("event_id", eventId)
      .in("status", [...ACTIVE_ENROLLMENT_STATUSES]);

    if (enrollmentsError) {
      throw new Error(`Kayıtlar alınamadı: ${enrollmentsError.message}`);
    }

    const enrollmentIds = new Set(
      ((enrollments ?? []) as EnrollmentRow[])
        .filter((row) => {
          const profile = unwrapOne(row.profiles);
          return profile ? isStudentParticipantProfile(profile) : false;
        })
        .map((row) => row.id),
    );
    const marksByEnrollment = new Map(
      input.marks.map((mark) => [mark.enrollmentId, mark.status] as const),
    );

    if (marksByEnrollment.size !== enrollmentIds.size) {
      throw new Error("Tüm öğrenciler için yoklama işaretlenmelidir.");
    }

    for (const enrollmentId of enrollmentIds) {
      if (!marksByEnrollment.has(enrollmentId)) {
        throw new Error("Tüm öğrenciler için yoklama işaretlenmelidir.");
      }
    }

    const outsideEventWindow = !isEventAttendanceOpen(event.start_at, event.end_at);
    const now = new Date().toISOString();

    for (const [enrollmentId, status] of marksByEnrollment) {
      const { error } = await this.client.from("enrollment_session_attendance").upsert(
        {
          enrollment_id: enrollmentId,
          session_id: input.sessionId,
          status,
          marked_by: actorId,
          marked_at: now,
          updated_at: now,
        },
        { onConflict: "enrollment_id,session_id" },
      );

      if (error) {
        throw new Error(`Yoklama kaydedilemedi: ${error.message}`);
      }

      const { error: unlockError } = await this.client.rpc("maybe_unlock_enrollment_post_test", {
        p_enrollment_id: enrollmentId,
      });

      if (unlockError) {
        throw new Error(`Son test kilidi güncellenemedi: ${unlockError.message}`);
      }
    }

    const { error: lockError } = await this.client
      .from("event_sessions")
      .update({
        attendance_submitted_at: now,
        attendance_submitted_by: actorId,
      })
      .eq("id", input.sessionId)
      .is("attendance_submitted_at", null);

    if (!alreadySubmitted && lockError) {
      throw new Error(`Yoklama onayı kaydedilemedi: ${lockError.message}`);
    }

    return {
      eventTitle: event.title,
      sessionLabel: formatEventLessonLabel(session.session_index),
      studentCount: marksByEnrollment.size,
      outsideEventWindow,
    };
  }
}
