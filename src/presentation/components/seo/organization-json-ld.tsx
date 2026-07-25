import { CONTACT } from "@/shared/constants/contact";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/shared/constants/site";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: CONTACT.email,
    telephone: CONTACT.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Pamukkale Teknokent, Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67",
      addressLocality: "Pamukkale",
      addressRegion: "Denizli",
      addressCountry: "TR",
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
