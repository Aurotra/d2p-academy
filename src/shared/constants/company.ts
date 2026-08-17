/** Legal entity details for footer, contracts, and payment compliance pages. */
export const COMPANY = {
  legalName:
    "ATH Eğitim Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi",
  brandName: "D2P Academy",
  brandDomain: "d2p.com.tr",
  mersisNo: "0101125115300001",
  addressLines: [
    "Kınıklı Mah. Hüseyin Yılmaz Cad. No:67",
    "Pamukkale Teknokent D Blok Z07-05",
    "Pamukkale / Denizli",
  ] as const,
  addressFull:
    "Kınıklı Mah. Hüseyin Yılmaz Cad. No:67, Pamukkale Teknokent D Blok Z07-05, Pamukkale / Denizli",
} as const;

export const LEGAL_PATHS = {
  about: "/hakkimizda",
  privacy: "/gizlilik-sozlesmesi",
  deliveryRefund: "/teslimat-ve-iade-sartlari",
  distanceSales: "/mesafeli-satis-sozlesmesi",
  kvkk: "/kvkk",
  /** Legacy aliases kept for existing links */
  privacyLegacy: "/gizlilik",
} as const;
