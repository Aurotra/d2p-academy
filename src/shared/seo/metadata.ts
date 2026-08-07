import type { Metadata } from "next";

import { SITE_URL } from "@/shared/constants/site";

export const NO_INDEX_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Longer title for Open Graph / Twitter when the document title should stay short. */
  socialTitle?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const title = input.absoluteTitle ? { absolute: input.title } : input.title;
  const socialTitle = input.socialTitle ?? input.title;

  return {
    title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: socialTitle,
      description: input.description,
      url: canonicalUrl,
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
    },
  };
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
