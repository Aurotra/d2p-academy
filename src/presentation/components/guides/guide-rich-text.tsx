import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Minimal inline markdown: **bold** and [label](/path) only.
 */
export function GuideRichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith("/")) {
          nodes.push(
            <Link key={key++} href={href} className="font-semibold text-document-primary hover:underline">
              {label}
            </Link>,
          );
        } else {
          nodes.push(
            <a
              key={key++}
              href={href}
              className="font-semibold text-document-primary hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              {label}
            </a>,
          );
        }
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}
