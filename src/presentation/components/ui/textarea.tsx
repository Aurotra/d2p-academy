import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const fieldClasses =
  "min-h-28 w-full rounded-xl border border-border-surface bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-subtle focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

export function Textarea({ className = "", label, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-navy-900">
          {label}
        </label>
      ) : null}
      <textarea id={textareaId} className={`${fieldClasses} ${className}`} {...props} />
    </div>
  );
}
