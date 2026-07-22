import Link from "next/link";
import type { ComponentProps } from "react";

export type AuthPortalKind = "student" | "parent" | "instructor";

const baseClasses =
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-100";

const kindClasses: Record<AuthPortalKind, string> = {
  student:
    "bg-accent text-sky-950 shadow-md shadow-accent/25 hover:bg-accent-dark hover:shadow-glow-accent focus-visible:ring-accent/50",
  parent:
    "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover hover:shadow-glow-primary focus-visible:ring-primary/30",
  instructor:
    "border-2 border-violet-700 bg-white text-violet-900 shadow-sm hover:bg-violet-50 focus-visible:ring-violet-300",
};

type AuthPortalLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  kind: AuthPortalKind;
  className?: string;
  block?: boolean;
};

export function AuthPortalLink({
  kind,
  className = "",
  block = false,
  children,
  ...props
}: AuthPortalLinkProps) {
  return (
    <Link
      className={`${baseClasses} ${kindClasses[kind]} ${block ? "w-full px-4 py-3" : "px-4 py-2"} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
