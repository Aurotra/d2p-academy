import type { ReactNode } from "react";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          D2P Academy
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
      </header>

      <div className="space-y-8 text-base leading-8 text-slate-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:not-first:mt-2 [&_p]:text-slate-700">
        {children}
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        Son güncelleme: {lastUpdated}
      </footer>
    </article>
  );
}
