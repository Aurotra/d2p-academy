import {
  buildParentAttendanceStatusLabel,
  getParentAttendancePercent,
  resolveTotalLessonCountForDisplay,
} from "@/shared/utils/enrollment-attendance";

interface ParentEnrollmentAttendanceProgressProps {
  presentCount?: number;
  totalLessonCount?: number;
}

/** Veli paneli: 12 ders üzerinden katıldı/katılmadı; sertifika eşiği (8) gösterilmez. */
export function ParentEnrollmentAttendanceProgress({
  presentCount = 0,
  totalLessonCount = 12,
}: ParentEnrollmentAttendanceProgressProps) {
  const total = resolveTotalLessonCountForDisplay(totalLessonCount);
  const percent = getParentAttendancePercent(presentCount, total);
  const statusLabel = buildParentAttendanceStatusLabel(presentCount, total);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-muted">Ders katılımı</span>
        <span className="font-bold text-navy-950">
          {presentCount}/{total}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-section"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Ders katılımı yüzde ${percent}`}
      >
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-subtle">{statusLabel}</p>
    </div>
  );
}
