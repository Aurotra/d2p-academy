export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  /** Placeholder body paragraphs — real copy will be added later. */
  paragraphs: string[];
}

/**
 * Static guide articles for /rehber.
 * Add new entries here; each slug gets a page via /rehber/[slug].
 */
export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "ornek-makale",
    title: "Örnek Rehber Yazısı",
    description:
      "D2P Academy rehber altyapısı için örnek sayfa. Gerçek makale içeriği daha sonra eklenecek.",
    publishedAt: "2026-08-12",
    paragraphs: [
      "Bu sayfa, /rehber içerik altyapısını test etmek için oluşturulmuş bir örnektir.",
      "Asıl makale metinleri onaylandıktan sonra buraya eklenecektir.",
    ],
  },
];

export function getGuideArticleBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((article) => article.slug === slug);
}
