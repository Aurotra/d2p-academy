export type AttendanceStatus = "present" | "absent" | "excused";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Geldi",
  absent: "Gelmedi",
  excused: "İzinli",
};

export interface EventSessionColumn {
  id: string;
  sessionIndex: number;
  startsAt: string;
  endsAt: string;
  label: string;
  timeRange?: string;
  attendanceSubmittedAt: string | null;
  attendanceLocked: boolean;
}

export interface AttendanceStudentRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentContact: string;
  enrollmentStatus: string;
  attendance: Record<string, AttendanceStatus | null>;
  presentCount: number;
  attendanceComplete: boolean;
}

export interface EventAttendanceSheet {
  eventId: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  sessions: EventSessionColumn[];
  requiredLessonCount: number;
  totalLessonCount: number;
  students: AttendanceStudentRow[];
  /** Yoklama işaretleme (etkinlik tarihleri içinde). */
  canEdit: boolean;
  attendanceOpen: boolean;
  /** Admin kilitli ders yoklamasını düzenleyebilir. */
  canEditLockedSessions: boolean;
}

export interface UpsertAttendanceInput {
  enrollmentId: string;
  sessionId: string;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface UpsertAttendanceResult {
  eventTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  sessionLabel: string;
  previousStatus: AttendanceStatus | null;
  status: AttendanceStatus;
  outsideEventWindow: boolean;
}

export interface SessionAttendanceMark {
  enrollmentId: string;
  status: AttendanceStatus;
}

export interface SubmitSessionAttendanceInput {
  sessionId: string;
  marks: SessionAttendanceMark[];
}

export interface SubmitSessionAttendanceResult {
  eventTitle: string;
  sessionLabel: string;
  studentCount: number;
  outsideEventWindow: boolean;
}
