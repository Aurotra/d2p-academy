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
}

export interface UpsertAttendanceInput {
  enrollmentId: string;
  sessionId: string;
  status: AttendanceStatus;
  notes?: string | null;
}
