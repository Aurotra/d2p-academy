import type { ReactNode } from "react";

import { BRAND_ACCENT_CARD_STYLES } from "@/shared/constants/brand-surfaces";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header
        className={`mb-10 rounded-[1.75rem] border p-6 sm:p-8 ${BRAND_ACCENT_CARD_STYLES.document}`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          D2P Academy
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-4xl">
          {title}
        </h1>
      </header>

      <div className="space-y-8 text-base leading-8 text-[var(--text-on-surface-soft)] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy-950 [&_h2]:not-first:mt-2 [&_p]:text-[var(--text-on-surface-soft)]">
        {children}
      </div>

      <footer className="mt-12 border-t border-border-surface pt-6 text-sm text-subtle">
        Son güncelleme: {lastUpdated}
      </footer>
    </article>
  );
}
