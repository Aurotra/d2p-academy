import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";

import "./globals.css";
import { OrganizationJsonLd } from "@/presentation/components/seo/organization-json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/shared/constants/site";
import { CSP_NONCE_HEADER } from "@/shared/config/csp-nonce";
import { SiteChrome } from "@/presentation/components/layout/site-chrome";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <html lang="tr" data-csp-nonce={nonce}>
      <body className="font-sans antialiased">
        <OrganizationJsonLd />
        <SiteChrome>{children}</SiteChrome>
      </body>    </html>
  );
}
