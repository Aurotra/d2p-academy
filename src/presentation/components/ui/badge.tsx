import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "navy" | "cyan" | "neutral";
}

const toneClasses = {
  navy: "bg-navy-900 text-white",
  cyan: "bg-accent/15 text-accent-dark ring-1 ring-accent/30",
  neutral: "bg-surface-section text-muted",
};

export function Badge({ className = "", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
