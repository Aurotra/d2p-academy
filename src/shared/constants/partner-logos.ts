export interface PartnerLogo {
  name: string;
  /** Public path or remote URL. Drop a file in `public/partners/` and point `src` here. */
  src: string;
  /** Optional destination. Omit for a non-clickable mark. */
  url?: string;
}

/**
 * Homepage logo band. Replace `src` with official logo files (SVG/PNG).
 * Keep marks on a transparent background so grayscale + hover color works.
 */
export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    name: "ATH Mühendislik",
    src: "/partners/ath-muhendislik.svg",
  },
  {
    name: "Honaz Belediyesi",
    src: "/partners/honaz-belediyesi.svg",
    url: "/rehber/honaz-belediyesi-3d-yaz-kursu",
  },
  {
    name: "Örnek Kurum",
    src: "/partners/ornek-kurum.svg",
  },
  {
    name: "Örnek Belediye",
    src: "/partners/ornek-belediye.svg",
  },
  {
    name: "Örnek Firma",
    src: "/partners/ornek-firma.svg",
  },
];
