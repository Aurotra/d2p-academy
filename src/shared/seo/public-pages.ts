import { publicPageMetadata } from "@/shared/seo/metadata";

const denizliStemKeywords = [
  "Denizli çocuk atölyesi",
  "3D tasarım eğitimi",
  "3D baskı atölyesi",
  "maker atölye",
  "STEM eğitimi",
  "tasarım ve üretim eğitimi",
  "D2P Academy",
] as const;

export const homePageMetadata = publicPageMetadata({
  title: "Denizli 3D Tasarım ve Atölye Eğitimleri",
  socialTitle: "Denizli 3D Tasarım ve 3D Baskı Atölye Eğitimleri",
  description:
    "D2P Academy, Denizli'de çocuklara 3D tasarım, 3D baskı ve maker atölye eğitimleri sunar. STEM odaklı tasarım ve üretim programları.",
  path: "/",
  keywords: [...denizliStemKeywords],
});

export const eventsPageMetadata = publicPageMetadata({
  title: "Teknoloji ve Robotik Etkinlikleri",
  description:
    "Denizli'de yaklaşan 3D tasarım, 3D baskı ve maker atölye etkinlikleri. D2P Academy takvimi, tarihler ve online kayıt bilgileri.",
  path: "/etkinlikler",
  keywords: [
    "Denizli çocuk etkinlikleri",
    "3D tasarım atölyesi",
    "3D baskı kursu",
    "maker atölye kayıt",
    "maker etkinlik takvimi",
    "D2P Academy etkinlikler",
  ],
});

export const parentGuidePageMetadata = publicPageMetadata({
  title: "Veli Rehberi ve Sıkça Sorulan Sorular",
  description:
    "D2P Academy veli kaydı, e-posta onayı, çocuk profili ve etkinlik kaydı adımları. Veliler için adım adım rehber ve SSS.",
  path: "/veli-rehberi",
  keywords: [
    "veli kayıt rehberi",
    "D2P Academy veli girişi",
    "çocuk hesabı oluşturma",
    "etkinlik kaydı nasıl yapılır",
    "veli paneli kullanımı",
  ],
});

export const galleryPageMetadata = publicPageMetadata({
  title: "Atölye Çalışmalarımızdan Kareler",
  description:
    "D2P Academy atölyelerinden kareler: Denizli'de 3D yazıcı, dijital tasarım ve maker eğitim fotoğrafları ile albümler.",
  path: "/galeri",
  keywords: [
    "D2P Academy galeri",
    "3D baskı atölye fotoğrafları",
    "çocuk STEM etkinlikleri",
    "Denizli maker atölye",
    "eğitim fotoğraf albümü",
  ],
});

export const contactPageMetadata = publicPageMetadata({
  title: "İletişim ve Adres — Pamukkale Teknokent, Denizli",
  description:
    "D2P Academy iletişim: Pamukkale Teknokent, Denizli. 3D tasarım ve baskı atölyeleri için telefon, e-posta, adres ve Instagram.",
  path: "/iletisim",
  keywords: [
    "D2P Academy iletişim",
    "Denizli 3D tasarım kursu",
    "Pamukkale Teknokent atölye",
    "çocuk eğitimi iletişim",
  ],
});

export const aboutPageMetadata = publicPageMetadata({
  title: "Hakkımızda — Tasarım ve Üretim Odaklı STEM Eğitimi",
  description:
    "D2P Academy; Denizli'de ATH Mühendislik bünyesinde 3D tasarım, 3D baskı ve STEM eğitimleriyle çocukların üreten bireyler olmasını hedefler.",
  path: "/hakkimizda",
  keywords: [
    "D2P Academy hakkında",
    "ATH Mühendislik eğitim",
    "tasarım odaklı düşünme",
    "Denizli STEM akademi",
    "3D üretim eğitimi",
  ],
});

export const institutionRequestPageMetadata = publicPageMetadata({
  title: "Kurumsal Eğitim Talebi — Okul ve Belediye Atölyeleri",
  description:
    "Okul ve belediyeler için D2P Academy kurumsal 3D tasarım, 3D baskı ve maker atölye eğitimi. Denizli merkezli anahtar teslim destek.",
  path: "/kurumsal-talep",
  keywords: [
    "kurumsal STEM eğitimi",
    "okul 3D yazıcı atölyesi",
    "belediye çocuk atölyesi",
    "toplu maker eğitimi",
    "D2P Academy kurumsal",
  ],
});

export const privacyPageMetadata = publicPageMetadata({
  title: "Gizlilik Politikası",
  description:
    "D2P Academy web sitesi ve dijital hizmetlerinde kişisel verilerin korunması, çerez kullanımı ve gizlilik ilkeleri.",
  path: "/gizlilik",
});

export const kvkkPageMetadata = publicPageMetadata({
  title: "KVKK Aydınlatma Metni",
  description:
    "D2P Academy kişisel verilerin işlenmesine ilişkin KVKK aydınlatma metni, veri sorumlusu bilgileri ve haklarınız.",
  path: "/kvkk",
});
