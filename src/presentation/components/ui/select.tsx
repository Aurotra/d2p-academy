import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ className = "", label, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-navy-900">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
