import { Textarea } from "@/presentation/components/ui/textarea";
import {
  D2P_EXPECTATION_LIKERT_OPTIONS,
  PROFILE_D2P_EXPECTATION_HELPER,
  PROFILE_D2P_EXPECTATION_LABEL,
  PROFILE_GOAL_HELPER,
  PROFILE_GOAL_LABEL,
  PROFILE_GOAL_PLACEHOLDER,
} from "@/shared/constants/profile-options";

interface ProfileMotivationFieldsProps {
  hedef: string;
  beklenti: number | "";
  onHedefChange: (value: string) => void;
  onBeklentiChange: (value: number) => void;
  beklentiName?: string;
}

export function ProfileMotivationFields({
  hedef,
  beklenti,
  onHedefChange,
  onBeklentiChange,
}: ProfileMotivationFieldsProps) {
  return (
    <div className="space-y-4">
      <Textarea
        label={PROFILE_GOAL_LABEL}
        placeholder={PROFILE_GOAL_PLACEHOLDER}
        maxLength={300}
        value={hedef}
        onChange={(event) => onHedefChange(event.target.value)}
      />
      <p className="text-xs text-slate-500">
        {hedef.length}/300 · {PROFILE_GOAL_HELPER}
      </p>

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          {PROFILE_D2P_EXPECTATION_LABEL}
        </legend>
        <p className="text-xs leading-5 text-slate-500">{PROFILE_D2P_EXPECTATION_HELPER}</p>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {D2P_EXPECTATION_LIKERT_OPTIONS.map((option) => {
            const selected = beklenti === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onBeklentiChange(option.value)}
                aria-pressed={selected}
                className={`min-h-11 w-full rounded-xl border px-1.5 py-2 text-center text-xs font-semibold transition sm:px-2 ${
                  selected
                    ? "border-document-primary bg-document-primary text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                }`}
              >
                <span className="block text-sm">{option.value}</span>
                <span className="mt-0.5 hidden text-[10px] font-normal leading-tight opacity-90 sm:block">
                  {option.label.replace(/^\d+\s*[—-]\s*/, "")}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
