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
    "D2P Academy, Denizli'de çocuk ve gençlere 3D tasarım, 3D baskı, prototipleme ve maker atölye eğitimleri sunar. Tasarım ve üretim odaklı STEM programları.",
  path: "/",
  keywords: [...denizliStemKeywords],
});

export const eventsPageMetadata = publicPageMetadata({
  title: "Teknoloji ve Robotik Etkinlikleri",
  description:
    "Yaklaşan 3D tasarım, 3D baskı ve maker atölye etkinlikleri. Denizli'de çocuklar için D2P Academy program takvimi, tarihler ve online kayıt.",
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
    "D2P Academy veli hesabı oluşturma, e-posta onayı, çocuk profili ekleme ve etkinlik kaydı adımları. Veliler için adım adım kayıt rehberi ve sık sorulan sorular.",
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
    "D2P Academy atölyelerinden fotoğraflar: 3D yazıcı, dijital tasarım ve maker etkinliklerinden Denizli eğitim galerisi ve albümler.",
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
    "D2P Academy iletişim bilgileri: Pamukkale Teknokent, Denizli. 3D tasarım, 3D baskı ve atölye eğitimleri için telefon, e-posta, adres ve sosyal medya.",
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
    "D2P Academy; ATH Mühendislik bünyesinde 3D tasarım, prototipleme, 3D baskı ve STEM uygulamalarıyla çocukların üreten bireyler olarak yetişmesini hedefleyen Denizli merkezli eğitim markasıdır.",
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
    "Okul, belediye ve kurumlar için D2P Academy toplu 3D tasarım, 3D baskı ve maker atölye eğitimi talebi. Anahtar teslim ekipman, eğitmen ve materyal desteği.",
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
