import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkLabel: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerHref,
  footerLinkLabel,
}: AuthShellProps) {
  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />
      <div className="pointer-events-none absolute -left-16 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-cyan-400/20 bg-white p-8 shadow-2xl shadow-navy-950/20">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-sm font-black text-navy-950">
              D2P
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-black text-navy-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-slate-600">
          {footerText}{" "}
          <Link href={footerHref} className="font-semibold text-cyan-700 hover:text-cyan-600">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
