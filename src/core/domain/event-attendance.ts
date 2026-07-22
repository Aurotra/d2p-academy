export type AttendanceStatus = "present" | "absent" | "excused";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Geldi",
  absent: "Gelmedi",
  excused: "İzinli",
};

export interface AttendanceRecord {
  enrollmentId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  notes: string | null;
  markedAt: string;
}

export interface AttendanceStudentRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentContact: string;
  enrollmentStatus: string;
  attendance: Record<string, AttendanceStatus | null>;
}

export interface EventAttendanceSheet {
  eventId: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  dates: string[];
  students: AttendanceStudentRow[];
  canEdit: boolean;
}

export interface UpsertAttendanceInput {
  enrollmentId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  notes?: string | null;
}
