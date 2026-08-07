"use client";

import { getChipButtonClass, getChipGridClass } from "@/shared/utils/chip-layout";

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
  const centered = options.length <= 2;

  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
      <legend className="px-1 text-sm font-semibold leading-6 text-navy-900">{label}</legend>
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
      <div className={getChipGridClass(options.length)}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={getChipButtonClass(selected, { centered })}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
