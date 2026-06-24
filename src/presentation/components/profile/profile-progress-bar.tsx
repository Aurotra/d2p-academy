import { calculateProgress } from "@/lib/utils/progress";
import type { ProfileProgressInput } from "@/core/domain/student-profile";

interface ProfileProgressBarProps {
  data: ProfileProgressInput;
}

export function ProfileProgressBar({ data }: ProfileProgressBarProps) {
  const progress = calculateProgress(data);

  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">Profil Tamamlanma</span>
        <span className="font-bold text-document-primary">%{progress}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-document-primary to-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">9 ana alandan {Math.round(progress / (100 / 9))} tanesi dolduruldu.</p>
    </div>
  );
}
