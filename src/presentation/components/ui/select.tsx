import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const fieldClasses =
  "w-full rounded-xl border border-border-surface bg-white px-4 py-3 text-sm text-navy-950 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

export function Select({ className = "", label, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-navy-900">
          {label}
        </label>
      ) : null}
      <select id={selectId} className={`${fieldClasses} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
