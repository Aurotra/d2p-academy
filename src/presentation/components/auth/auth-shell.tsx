import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { BrandLogo } from "@/presentation/components/layout/brand-logo";

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
      <div className={`pointer-events-none absolute inset-0 ${BRAND_SURFACE_GRADIENT}`} />
      <div className="pointer-events-none absolute -left-16 top-16 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-sky-200 bg-white p-8 shadow-2xl shadow-sky-200/60">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrandLogo height={44} />
          </div>
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
