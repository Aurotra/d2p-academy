import { CONTACT } from "@/shared/constants/contact";
import { SITE_DESCRIPTION, SITE_LOGO_SRC, SITE_NAME, SITE_URL } from "@/shared/constants/site";
import { absoluteUrl } from "@/shared/seo/metadata";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: CONTACT.email,
    telephone: CONTACT.phoneTel,
    logo: absoluteUrl(SITE_LOGO_SRC),
    image: absoluteUrl(SITE_LOGO_SRC),
    areaServed: {
      "@type": "City",
      name: "Denizli",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Pamukkale Teknokent, Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67",
      addressLocality: "Pamukkale",
      addressRegion: "Denizli",
      addressCountry: "TR",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    sameAs: [CONTACT.instagramUrl],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
