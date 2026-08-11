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
