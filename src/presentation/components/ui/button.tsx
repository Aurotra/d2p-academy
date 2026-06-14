import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/30 shadow-lg shadow-primary/20 hover:shadow-glow-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary/30 shadow-lg shadow-secondary/20 hover:shadow-glow-secondary",
  outline:
    "border-2 border-sky-800 bg-white text-sky-950 shadow-md shadow-sky-200/60 hover:border-sky-900 hover:bg-sky-50 focus-visible:ring-sky-400",
  ghost: "text-sky-800 hover:bg-sky-100/80 focus-visible:ring-accent/40",
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
