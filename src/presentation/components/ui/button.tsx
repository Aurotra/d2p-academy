import type { ButtonHTMLAttributes } from "react";

import { BUTTON_PRESS_CLASSES } from "@/shared/utils/button-press";

export type ButtonVariant = "primary" | "secondary" | "accent" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/30 shadow-lg shadow-primary/20 hover:shadow-glow-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary/30 shadow-lg shadow-secondary/20 hover:shadow-glow-secondary",
  accent:
    "bg-accent text-navy-950 hover:bg-accent-dark focus-visible:ring-accent/40 shadow-lg shadow-accent/20 hover:shadow-glow-accent",
  outline:
    "border-2 border-navy-800 bg-white text-navy-950 shadow-md shadow-secondary/10 hover:border-navy-900 hover:bg-surface-section focus-visible:ring-secondary/40",
  ghost: "text-navy-900 hover:bg-surface-tint-mixed focus-visible:ring-accent/40",
};

const baseClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base";

/** Tailwind classes for `<Link>` elements that should look like buttons. */
export function buttonLinkClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `${BUTTON_PRESS_CLASSES} ${baseClasses} inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold ${variantClasses[variant]} ${className}`;
}

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BUTTON_PRESS_CLASSES} ${baseClasses} inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 disabled:active:brightness-100 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
