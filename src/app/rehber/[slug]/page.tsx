import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideArticleBody } from "@/presentation/components/guides/guide-article-body";
import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import { GUIDE_ARTICLES, getGuideArticleBySlug } from "@/shared/content/guides";
import { publicPageMetadata } from "@/shared/seo/metadata";

/** Gallery figures use signed Supabase URLs — avoid stale static HTML. */
export const dynamic = "force-dynamic";

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

  const showLeadDescription = !article.blocks?.length;

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
        {showLeadDescription ? (
          <p className="mt-4 text-base text-muted">{article.description}</p>
        ) : null}
        <GuideArticleBody article={article} />
      </article>
    </PublicPageShell>
  );
}
