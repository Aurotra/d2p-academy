const CERTIFICATE_RPC_ERRORS: Record<string, string> = {
  "Only admins can issue certificates.": "Sertifika vermek için admin yetkisi gerekli.",
  "Enrollment not found.": "Kayıt bulunamadı.",
  "Enrollment must be completed before issuing a certificate.":
    "Sertifika vermeden önce kayıt Tamamlandı olmalıdır.",
  "İptal veya gelmedi durumundaki kayda sertifika verilemez.":
    "İptal veya gelmedi durumundaki kayda sertifika verilemez.",
  "Certificate already exists for this enrollment.":
    "Bu kayıt için sertifika zaten oluşturulmuş. Listeden PDF Oluştur’a tıklayın.",
  "Event program_code is missing. Set program_code on the event (e.g. DC) before issuing a certificate.":
    "Etkinlikte program kodu eksik. Sertifika vermeden önce program_code atayın (ör. DC).",
  "Invalid program_code. Use 2–4 letters (e.g. DC).":
    "Geçersiz program kodu. 2–4 harf kullanın (ör. DC).",
  "Invalid program_code. Only A–Z letters are allowed (e.g. DC).":
    "Geçersiz program kodu. Yalnızca A–Z harflerine izin verilir (ör. DC).",
  "Sertifika iptal etmek için admin yetkisi gerekli.":
    "Sertifika iptal etmek için admin yetkisi gerekli.",
  "Sertifika bulunamadı.": "Sertifika bulunamadı.",
  "Son test tamamlanmadan sertifika verilemez.":
    "Son test tamamlanmadan sertifika verilemez.",
};

export function translateCertificateRpcError(message: string | null | undefined): string {
  if (!message?.trim()) {
    return "Bilinmeyen hata";
  }

  const trimmed = message.trim();
  if (CERTIFICATE_RPC_ERRORS[trimmed]) {
    return CERTIFICATE_RPC_ERRORS[trimmed];
  }

  for (const [english, turkish] of Object.entries(CERTIFICATE_RPC_ERRORS)) {
    if (trimmed.includes(english)) {
      return turkish;
    }
  }

  return trimmed;
}
