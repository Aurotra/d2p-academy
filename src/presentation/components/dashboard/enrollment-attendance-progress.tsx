import {
  buildEnrollmentAttendanceStatusLabel,
  getEnrollmentAttendancePercent,
  resolveRequiredLessonCount,
} from "@/shared/utils/enrollment-attendance";

interface EnrollmentAttendanceProgressProps {
  presentCount?: number;
  requiredLessonCount?: number;
  totalLessonCount?: number;
  attendanceComplete?: boolean;
}

export function EnrollmentAttendanceProgress({
  presentCount = 0,
  requiredLessonCount,
  totalLessonCount = 12,
  attendanceComplete,
}: EnrollmentAttendanceProgressProps) {
  const required = resolveRequiredLessonCount(requiredLessonCount);
  const percent = getEnrollmentAttendancePercent(presentCount, requiredLessonCount);
  const statusLabel = buildEnrollmentAttendanceStatusLabel(
    presentCount,
    requiredLessonCount,
    totalLessonCount,
    attendanceComplete,
  );
  const complete = attendanceComplete ?? presentCount >= required;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">Yoklama</span>
        <span className="font-bold text-navy-950">
          {presentCount}/{required}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Yoklama yüzde ${percent}`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            complete ? "bg-emerald-500" : "bg-cyan-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
    </div>
  );
}
