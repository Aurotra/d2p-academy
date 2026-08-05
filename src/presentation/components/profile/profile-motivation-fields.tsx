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
  beklentiName = "beklenti",
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

      <fieldset>
        <legend className="text-sm font-medium text-slate-900">{PROFILE_D2P_EXPECTATION_LABEL}</legend>
        <p className="mt-1 text-xs leading-5 text-slate-500">{PROFILE_D2P_EXPECTATION_HELPER}</p>
        <div className="mt-3 space-y-2">
          {D2P_EXPECTATION_LIKERT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-start gap-2 text-sm leading-6">
              <input
                type="radio"
                name={beklentiName}
                value={option.value}
                checked={beklenti === option.value}
                onChange={() => onBeklentiChange(option.value)}
                className="mt-1"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
