import Link from "next/link";
import { redirect } from "next/navigation";

import type { DocumentRecord } from "@/core/domain/document";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseDocumentRepository } from "@/infrastructure/repositories/supabase-document-repository";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
  }).format(date);
}

function DocumentCard({ document }: { document: DocumentRecord }) {
  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-document-primary/40 hover:shadow-md">
      <div>
        <div className="mb-4 inline-flex rounded-xl bg-document-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-document-primary">
          Doküman
        </div>
        <h2 className="text-lg font-bold text-slate-900">{document.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{formatDate(document.createdAt)}</p>
      </div>
      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-document-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        Dosyayı Aç
      </a>
    </article>
  );
}

export default async function DashboardDocumentsPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository = new SupabaseDocumentRepository(client);
  const documents = await repository.listDocuments();

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              Öğrenci Paneli
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Dökümanlar ve Ödevler</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Eğitmenlerin paylaştığı materyallere buradan ulaşabilirsiniz.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
          >
            ← Panele Dön
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-800">Henüz doküman yüklenmedi.</p>
            <p className="mt-2 text-sm text-slate-500">
              Yeni materyaller eklendiğinde bu sayfada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
