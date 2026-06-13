import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "navy" | "cyan" | "neutral";
}

const toneClasses = {
  navy: "bg-navy-900 text-cyan-100",
  cyan: "bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-500/30",
  neutral: "bg-slate-100 text-slate-700",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
