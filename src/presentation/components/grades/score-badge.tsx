import { getScoreLabel, type ScoreLabelTone } from "@/core/domain/grade";

const toneClasses: Record<ScoreLabelTone, string> = {
  success: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-100 text-amber-800 ring-amber-200",
  danger: "bg-red-100 text-red-800 ring-red-200",
};

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const { label, tone } = getScoreLabel(score);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {label} · {score}
    </span>
  );
}
