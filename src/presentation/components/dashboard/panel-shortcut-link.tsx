import Link from "next/link";
import type { ReactNode } from "react";

type PanelShortcutVariant = "admin" | "instructor" | "parent";

const variantClasses: Record<PanelShortcutVariant, string> = {
  admin:
    "border border-primary/25 bg-primary text-white shadow-md shadow-primary/15 hover:bg-primary-hover",
  instructor:
    "border border-violet-700/25 bg-violet-600 text-white shadow-md shadow-violet-600/15 hover:bg-violet-700",
  parent:
    "border-2 border-border-surface bg-white/95 text-navy-950 shadow-sm hover:border-secondary/40 hover:bg-surface-section",
};

interface PanelShortcutLinkProps {
  href: string;
  title: string;
  caption: string;
  variant: PanelShortcutVariant;
  isActive?: boolean;
}

export function PanelShortcutLink({
  href,
  title,
  caption,
  variant,
  isActive = false,
}: PanelShortcutLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[52px] min-w-[8.5rem] flex-col items-center justify-center rounded-xl px-4 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${variantClasses[variant]} ${
        isActive ? "ring-2 ring-secondary/40 ring-offset-2 ring-offset-surface-base" : ""
      }`}
    >
      <span className="text-sm font-bold leading-tight">{title}</span>
      <span className="mt-1 text-[11px] font-medium leading-tight opacity-90">{caption}</span>
    </Link>
  );
}

export function PanelShortcutGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-2 sm:gap-3">{children}</div>;
}
