import Link from "next/link";

import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { GUIDE_ARTICLES } from "@/shared/content/guides";
import { publicPageMetadata } from "@/shared/seo/metadata";
import { BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";

export const metadata = publicPageMetadata({
  title: "Rehber — 3D Tasarım ve Atölye Yazıları",
  description:
    "Denizli'de 3D tasarım, 3D baskı ve çocuk atölyeleri hakkında D2P Academy rehber yazıları. Veli ve kurumlar için bilgilendirici içerikler.",
  path: "/rehber",
  keywords: [
    "D2P Academy rehber",
    "Denizli 3D tasarım",
    "çocuk atölye rehberi",
    "3D baskı eğitimi",
  ],
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

export default function RehberIndexPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Rehber
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl">
          Atölye ve eğitim rehberi
        </h1>
        <p className="mt-3 text-base text-muted">
          3D tasarım, baskı ve D2P Academy programları hakkında bilgilendirici yazılar.
        </p>

        <ul className="mt-10 space-y-4">
          {GUIDE_ARTICLES.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/rehber/${article.slug}`}
                className={`block rounded-[1.5rem] border border-border-surface p-6 transition hover:border-secondary/40 ${BRAND_SURFACE_CARD}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  {formatDate(article.publishedAt)}
                </p>
                <h2 className="mt-2 text-xl font-bold text-navy-950">{article.title}</h2>
                <p className="mt-2 text-sm text-muted">{article.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PublicPageShell>
  );
}
