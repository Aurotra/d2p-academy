import Link from "next/link";

import { BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";
import { GUIDE_ARTICLES } from "@/shared/content/guides";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

interface GuideArticlesGridProps {
  title?: string;
  description?: string;
  className?: string;
}

export function GuideArticlesGrid({
  title = "İlginizi Çekebilecek Yazılar",
  description = "3D tasarım, STEM ve atölye deneyimleri hakkında rehber yazılarımız.",
  className = "",
}: GuideArticlesGridProps) {
  return (
    <section className={className} aria-labelledby="guide-articles-heading">
      <h2 id="guide-articles-heading" className="text-xl font-bold text-navy-950 sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-7 text-muted sm:text-base">{description}</p>
      ) : null}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {GUIDE_ARTICLES.map((article) => (
          <li key={article.slug} className="min-w-0">
            <Link
              href={`/rehber/${article.slug}`}
              className={`flex h-full flex-col rounded-[1.25rem] border border-border-surface p-5 transition hover:border-secondary/40 ${BRAND_SURFACE_CARD}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                {formatDate(article.publishedAt)}
              </p>
              <h3 className="mt-2 text-base font-bold leading-snug text-navy-950">
                {article.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">
                {article.description}
              </p>
              <span className="mt-4 text-sm font-semibold text-document-primary">
                Yazıyı oku →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-center text-sm text-muted">
        Tüm yazılar için{" "}
        <Link href="/rehber" className="font-semibold text-document-primary hover:underline">
          makaleler sayfasına
        </Link>{" "}
        göz atabilirsiniz.
      </p>
    </section>
  );
}
