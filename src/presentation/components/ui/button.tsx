import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-500 text-navy-950 hover:bg-cyan-400 focus-visible:ring-cyan-300 shadow-lg shadow-cyan-500/20",
  secondary:
    "border border-cyan-400/40 bg-white/10 text-white hover:bg-white/15 focus-visible:ring-cyan-300",
  ghost: "text-cyan-100 hover:bg-white/10 focus-visible:ring-cyan-300",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-100 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
