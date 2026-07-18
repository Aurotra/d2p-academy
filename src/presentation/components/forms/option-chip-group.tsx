"use client";

interface OptionChipGroupProps {
  label: string;
  options: readonly string[];
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

export function OptionChipGroup({
  label,
  options,
  multiple = false,
  value,
  onChange,
}: OptionChipGroupProps) {
  const selected = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string"
      ? value
      : "";

  function toggle(option: string) {
    if (multiple) {
      const current = Array.isArray(selected) ? selected : [];
      const noneOption = "Hiçbirine katılmadım";
      let next: string[];

      if (option === noneOption) {
        next = current.includes(noneOption) ? [] : [noneOption];
      } else {
        next = current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current.filter((item) => item !== noneOption), option];
      }

      onChange(next);
      return;
    }

    onChange(option);
  }

  return (
    <fieldset className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = multiple
            ? Array.isArray(selected) && selected.includes(option)
            : selected === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isSelected
                  ? "bg-document-primary text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
