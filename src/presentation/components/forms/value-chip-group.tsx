"use client";

interface ValueChipOption {
  value: string;
  label: string;
}

interface ValueChipGroupProps {
  label: string;
  options: readonly ValueChipOption[];
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

export function ValueChipGroup({
  label,
  options,
  value,
  onChange,
  helperText,
}: ValueChipGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-navy-900">{label}</legend>
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? "bg-document-primary text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
