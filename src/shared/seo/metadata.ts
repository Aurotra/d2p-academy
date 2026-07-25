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
}): Metadata {
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalPath,
    },
  };
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
