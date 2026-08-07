/** Public contact details — single source for /iletisim, footer, etc. */
export const CONTACT = {
  organization: "D2P Academy | ATH Mühendislik",
  addressLines: [
    "Pamukkale Teknokent",
    "Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67",
    "Pamukkale / Denizli",
  ],
  addressFull:
    "Pamukkale Teknokent, Çamlaraltı Mah. Hüseyin Yılmaz Cad. No:67, Pamukkale / Denizli",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=Pamukkale+Teknokent,+%C3%87amlaralt%C4%B1+Mah.+H%C3%BCseyin+Y%C4%B1lmaz+Cad.+No:67,+Denizli&output=embed",
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Pamukkale+Teknokent+Denizli",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Pamukkale+Teknokent+Denizli",
  phoneDisplay: "0555 542 04 44",
  phoneTel: "+905555420444",
  email: "info@d2p.com.tr",
  workingHours: "Pazartesi–Cuma, 09:00–18:00",
  instagramHandle: "d2p_academy",
  instagramUrl: "https://www.instagram.com/d2p_academy/",
  whatsappLabel: "7/24 WhatsApp Destek Hattı",
} as const;

export const WHATSAPP_SUPPORT_MESSAGES = {
  default: "Merhaba, D2P Academy hakkında yardıma ihtiyacım var.",
  register:
    "Merhaba, D2P Academy veli kaydı sırasında yardıma ihtiyacım var. Sorunumu paylaşmak istiyorum.",
  login: "Merhaba, D2P Academy giriş işlemi sırasında yardıma ihtiyacım var.",
  confirm: "Merhaba, D2P Academy e-posta onayı konusunda yardıma ihtiyacım var.",
} as const;

export type WhatsAppSupportContext = keyof typeof WHATSAPP_SUPPORT_MESSAGES;

const MOBILE_WHATSAPP_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function isMobileWhatsAppUserAgent(userAgent: string): boolean {
  return MOBILE_WHATSAPP_UA.test(userAgent);
}

export function getWhatsAppSupportUrl(
  context: WhatsAppSupportContext = "default",
  options?: { userAgent?: string },
): string {
  const phone = CONTACT.phoneTel.replace(/\D/g, "");
  const text = encodeURIComponent(WHATSAPP_SUPPORT_MESSAGES[context]);
  const useMobileLink =
    options?.userAgent == null || isMobileWhatsAppUserAgent(options.userAgent);

  if (useMobileLink) {
    return `https://wa.me/${phone}?text=${text}`;
  }

  return `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
}
