import type { GuideArticle, GuideBlock } from "@/shared/content/guides";
import { GuideGalleryFigure } from "@/presentation/components/guides/guide-gallery-figure";
import { GuideRichText } from "@/presentation/components/guides/guide-rich-text";

function GuideBlockView({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <GuideRichText text={block.text} />
        </p>
      );
    case "heading":
      if (block.level === 3) {
        return <h3 className="!mt-8 text-xl font-bold text-navy-950">{block.text}</h3>;
      }
      return <h2 className="!mt-10 text-2xl font-bold text-navy-950">{block.text}</h2>;
    case "list":
      return (
        <ul className="list-disc space-y-3 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <GuideRichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal space-y-3 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <GuideRichText text={item} />
            </li>
          ))}
        </ol>
      );
    case "note":
      return (
        <p className="text-sm italic text-muted">
          <GuideRichText text={block.text} />
        </p>
      );
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-2xl border border-secondary/15">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-secondary/15 bg-surface-section/80">
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold text-navy-950">
                    <GuideRichText text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-secondary/10 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${cellIndex}-${cell}`}
                      className="px-4 py-3 align-top text-[var(--text-on-surface-soft)]"
                    >
                      <GuideRichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <blockquote className="mt-10 rounded-2xl border border-document-primary/20 bg-document-primary/5 px-5 py-5 sm:px-6">
          <p className="text-base font-semibold text-navy-950">
            <GuideRichText text={block.title} />
          </p>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-base leading-7 text-[var(--text-on-surface-soft)]">
              <GuideRichText text={paragraph} />
            </p>
          ))}
        </blockquote>
      );
    case "galleryFigure":
      return (
        <GuideGalleryFigure
          albumSlug={block.albumSlug}
          photoIndex={block.photoIndex}
          preferCover={block.preferCover}
        />
      );
    default:
      return null;
  }
}

export function GuideArticleBody({ article }: { article: GuideArticle }) {
  if (article.blocks?.length) {
    return (
      <div className="mt-8 space-y-4 text-base leading-7 text-[var(--text-on-surface-soft)]">
        {article.blocks.map((block, index) => (
          <GuideBlockView key={`${block.type}-${index}`} block={block} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 text-base leading-7 text-[var(--text-on-surface-soft)]">
      {(article.paragraphs ?? []).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
