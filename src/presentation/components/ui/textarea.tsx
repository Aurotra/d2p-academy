import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className = "", label, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-navy-900">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={`min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 ${className}`}
        {...props}
      />
    </div>
  );
}
