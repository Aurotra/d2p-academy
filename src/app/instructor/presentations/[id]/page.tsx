import Link from "next/link";

import { PresentationViewer } from "@/presentation/components/instructor/presentation-viewer";

type PageProps = { params: Promise<{ id: string }> };

export default async function InstructorPresentationPlayPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/instructor/presentations"
          className="text-sm font-semibold text-navy-900 hover:underline"
        >
          ← Sunumlarım
        </Link>
        <p className="text-xs text-subtle">
          Ok tuşları / Space ile geçiş · ESC tam ekrandan çıkar · Ctrl+P/S engelli
        </p>
      </div>
      <PresentationViewer presentationId={id} />
    </div>
  );
}
