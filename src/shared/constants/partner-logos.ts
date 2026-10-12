export interface PartnerLogo {
  name: string;
  /** Public path or remote URL. Drop a file in `public/partners/` and point `src` here. */
  src: string;
  /** Optional destination. Omit for a non-clickable mark. */
  url?: string;
}

/**
 * Homepage logo band. Add a file under `public/partners/` and append it here.
 * Prefer transparent PNG/SVG so the grayscale treatment stays clean.
 */
export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    name: "Pamukkale Üniversitesi",
    src: "/partners/pamukkale-universitesi.png",
    url: "https://www.pau.edu.tr",
  },
  {
    name: "Türkiye Kamu-Sen",
    src: "/partners/turkiye-kamu-sen.png",
    url: "https://www.kamusen.org.tr",
  },
  {
    name: "Honaz Belediyesi",
    src: "/partners/honaz-belediyesi.png",
    url: "https://www.honaz.bel.tr",
  },
  {
    name: "TMMOB Makina Mühendisleri Odası",
    src: "/partners/tmmob-mmo.png",
    url: "https://www.mmo.org.tr",
  },
  {
    name: "3D teknomarket",
    src: "/partners/3d-teknomarket.png",
    url: "https://www.3dteknomarket.com",
  },
];
