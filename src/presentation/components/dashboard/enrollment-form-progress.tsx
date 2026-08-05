import {
  buildEnrollmentFormStatusLabel,
  getEnrollmentFormCompletionPercent,
} from "@/shared/utils/enrollment-form-status";

interface EnrollmentFormProgressProps {
  intakeCompleted?: boolean;
  consentsCompleted?: boolean;
  preTestCompleted?: boolean;
  postTestCompleted?: boolean;
  postTestUnlocked?: boolean;
  requiresSurveys?: boolean;
}

export function EnrollmentFormProgress({
  intakeCompleted,
  consentsCompleted,
  preTestCompleted,
  postTestCompleted,
  postTestUnlocked,
  requiresSurveys,
}: EnrollmentFormProgressProps) {
  const input = {
    intakeCompleted,
    consentsCompleted,
    preTestCompleted,
    postTestCompleted,
    postTestUnlocked,
    requiresSurveys,
  };
  const percent = getEnrollmentFormCompletionPercent(input);
  const statusLabel = buildEnrollmentFormStatusLabel(input);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">Kayıt tamamlanma</span>
        <span className="font-bold text-navy-950">%{percent}</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Kayıt tamamlanma yüzde ${percent}`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            percent === 100 ? "bg-emerald-500" : "bg-document-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
    </div>
  );
}
