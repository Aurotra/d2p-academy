import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const fieldClasses =
  "w-full rounded-xl border border-border-surface bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-subtle focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

export function Input({ className = "", label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-navy-900">
          {label}
        </label>
      ) : null}
      <input id={inputId} className={`${fieldClasses} ${className}`} {...props} />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
