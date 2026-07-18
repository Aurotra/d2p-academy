import type { ConsentDocument } from "@/shared/constants/participant-forms";

interface ConsentDocumentCardProps {
  document: ConsentDocument;
}

export function ConsentDocumentCard({ document }: ConsentDocumentCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-navy-950">
          {document.code} — {document.title}
        </h3>
        <span className="text-xs font-medium text-slate-500">{document.version}</span>
      </div>
      <div className="max-h-56 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6 text-slate-700">
        {document.paragraphs.map((paragraph, index) => (
          <p key={`${document.code}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
