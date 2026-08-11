import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { GUIDE_ARTICLES, getGuideArticleBySlug } from "@/shared/content/guides";
import { publicPageMetadata } from "@/shared/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideArticleBySlug(slug);
  if (!article) {
    return { title: "Yazı bulunamadı" };
  }

  return publicPageMetadata({
    title: article.title,
    description: article.description,
    path: `/rehber/${article.slug}`,
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

export default async function RehberArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getGuideArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/rehber"
          className="text-sm font-semibold text-document-primary hover:underline"
        >
          ← Tüm rehber yazıları
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-subtle">
          {formatDate(article.publishedAt)}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy-950 sm:text-4xl">{article.title}</h1>
        <p className="mt-4 text-base text-muted">{article.description}</p>
        <div className="mt-8 space-y-4 text-base leading-7 text-[var(--text-on-surface-soft)]">
          {article.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </PublicPageShell>
  );
}
