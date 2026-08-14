/** Legal entity details for footer, contracts, and iyzico compliance pages. */
export const COMPANY = {
  legalName:
    "ATH Eğitim Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi",
  brandName: "D2P Academy",
  brandDomain: "d2p.com.tr",
  mersisNo: "0101125115300001",
  addressLines: [
    "Teknokent, Kınıklı, Hüseyin Yılmaz Cd. No:67",
    "20160 Pamukkale / Denizli",
  ] as const,
  addressFull:
    "Teknokent, Kınıklı, Hüseyin Yılmaz Cd. No:67, 20160 Pamukkale/Denizli",
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
