import type { Product, ProductCategory, DifficultyLevel } from "@/core/domain/store";

export const STORE_PRODUCTS: readonly Product[] = [
  {
    id: "prod-fennec-planespotter",
    slug: "fennec-planespotter-masaustu-ucak-izleme-cihazi",
    title: "Fennec PlaneSpotter",
    subtitle: "Canlı Masaüstü Uçak İzleme Radarı",
    description:
      "Gökyüzündeki canlı trafiği masanıza taşıyın. Fennec PlaneSpotter, bulunduğunuz bölgenin üstünden geçen ticari uçakları ve hava araçlarını gerçek zamanlı olarak ekranına taşıyan akıllı bir masaüstü izleme cihazıdır. Kurulum veya teknik montaj gerektirmeyen Tak Çalıştır yapısı sayesinde kutudan çıktığı anda çalışma masanızın en dikkat çekici teknoloji objesi olmaya hazırdır.\n\nSesli ve titreşimli akıllı ikaz sistemi: Gözünüz sürekli ekranda olmasa bile gökyüzündeki hareketliliği kaçırmazsınız. PlaneSpotter, belirlediğiniz kapsama alanına yeni bir uçak girdiğinde dahili titreşim motoru ve sesli uyarı sistemi ile sizi anında haberdar eder.\n\nSaniyeler içinde konumunuzu tanımlayın: Cihazı standart bir Type-C kablo ile güce bağladıktan sonra dahili Wi-Fi arayüzü üzerinden kendi konumunuzu veya takip etmek istediğiniz bölge koordinatını kolayca girebilirsiniz. Belirlediğiniz yarıçap içerisindeki hava sahasını tarayarak üzerinizden geçen uçakları anlık olarak ekranına yansıtır.\n\n%100 Fennec tasarımı ve mühendisliği: Dış kabuk tasarımından gömülü radar yazılımına ve donanım mimarisine kadar her detay tamamen Fennec bünyesinde geliştirilmiş ve üretilmiştir.",
    highlights: [
      "Gerçek zamanlı hava sahası takibi",
      "Sesli ve titreşimli akıllı ikaz",
      "Wi-Fi ile kolay konum / bölge ayarı",
      "Type-C tak-çalıştır güç girişi",
      "Kurulumsuz, kullanıma hazır cihaz",
      "%100 Fennec tasarım ve mühendislik",
    ],
    price: 3450,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "ready-device",
    images: [
      {
        src: "/images/store/fennec-planespotter-military.jpg",
        alt: "Fennec PlaneSpotter askeri yeşil masaüstü uçak izleme radarı",
      },
      {
        src: "/images/store/fennec-planespotter-navy.jpg",
        alt: "Fennec PlaneSpotter lacivert masaüstü uçak izleme radarı",
      },
      {
        src: "/images/store/fennec-planespotter-white.jpg",
        alt: "Fennec PlaneSpotter beyaz masaüstü uçak izleme radarı",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "Genel / Havacılık Meraklıları",
      assemblyTime: "Kurulumsuz (Tak Çalıştır / Plug & Play)",
      material: "Fennec endüstriyel dış kabuk (özel üretim)",
      microcontroller: "Dahili Wi-Fi 2.4 GHz + sesli/titreşimli ikaz ünitesi",
    },
    bomList: {
      printedParts: ["1x Fennec PlaneSpotter (montajlı hazır cihaz)"],
      electronicParts: [
        "Dahili sesli uyarı ve titreşim (haptik) ikaz sistemi",
        "USB Type-C güç girişi (5V DC sürekli besleme)",
        "1x Type-C güç kablosu",
      ],
      digitalAccess: [
        "Hızlı başlangıç kılavuzu",
        "Wi-Fi web arayüzü ile konum / bölge (koordinat) ayarı",
        "Canlı uçak tespiti ve ekran bildirimi",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      kitVersionStatus: "none",
      curriculumPreview: [],
    },
  },
  {
    id: "prod-ath-360-doner-tabla",
    slug: "ath-360-doner-sergileme-tablasi",
    title: "ATH 360° Döner Sergileme Tablası",
    subtitle: "210 mm Tam Tur Sunum Standı",
    description:
      "Ürünlerinizi ve koleksiyonlarınızı her açıdan kusursuzca sergileyin. ATH 360° Döner Sergileme Tablası; e-ticaret çekimleri, sosyal medya videoları ve vitrin sunumları için tasarlanmış kablosuz, bataryalı bir döner standdır. Şık ve minimal gövdesi sayesinde dikkat ürününüzde kalır.\n\n210 mm geniş sergileme alanı: Takı, kozmetik, figür, model, elektronik, ayakkabı ve dekoratif objeler için idealdir. Akıcı 360° dönüşü titreşimsiz ve takılmasız çalışır; profesyonel fotoğraf ve video çekimlerine uygundur.\n\nKablo karmaşası yok: Kaliteli bir 9V pil ile 10+ saat kesintisiz performans sunar. Prize ihtiyaç duymadan istediğiniz yerde kullanabilirsiniz.\n\nRenk seçenekleri: Standart olarak siyah ve beyaz üretilir. Talep ettiğiniz özel renklerde de üretilebilir — sipariş öncesi iletişime geçmeniz yeterlidir.",
    highlights: [
      "210 mm (21 cm) geniş sergileme alanı",
      "Akıcı ve sessiz 360° dönüş",
      "Kablosuz / 9V batarya ile kullanım",
      "Tek şarjda 10+ saat kesintisiz performans",
      "Siyah ve beyaz standart; özel renk üretilebilir",
      "E-ticaret, vitrin ve koleksiyon sunumuna uygun",
    ],
    price: 0,
    currency: "TRY",
    stockStatus: "coming_soon",
    category: "display-presentation",
    images: [
      {
        src: "/images/store/ath-360-doner-tabla-beyaz.jpg",
        alt: "ATH beyaz 360 derece döner sergileme tablası",
      },
      {
        src: "/images/store/ath-360-doner-tabla-siyah.jpg",
        alt: "ATH siyah 360 derece döner sergileme tablası",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "Genel / Sunum & İçerik Üreticileri",
      assemblyTime: "Kurulumsuz (batarya tak, çalıştır)",
      material: "ATH endüstriyel dış kabuk (siyah / beyaz / özel renk)",
      microcontroller: "Dahili motor + güç anahtarı (9V batarya)",
    },
    bomList: {
      printedParts: ["1x 210 mm 360° döner sergileme tablası"],
      electronicParts: [
        "Dahili sessiz dönüş motoru",
        "9V batarya yuvası (batarya kutuya dahil değildir)",
        "Ön panel güç anahtarı",
      ],
      digitalAccess: [
        "Kullanım önerileri (e-ticaret / sosyal medya çekimi)",
        "Renk seçimi: siyah, beyaz veya özel talep",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      kitVersionStatus: "none",
      curriculumPreview: [],
    },
  },
  {
    id: "prod-ath-y-karistirici",
    slug: "ath-y-tipi-laboratuvar-karistirici",
    title: "ATH Y-Tipi Laboratuvar Karıştırıcı",
    subtitle: "Masaüstü Toz ve Granül Homojen Karıştırıcı",
    description:
      "ATH Y-Tipi Laboratuvar Karıştırıcı; toz, granül ve küçük numuneleri homojen biçimde karıştırmak için tasarlanmış kompakt bir masaüstü laboratuvar ekipmanıdır. Y-formundaki kap, dönme hareketiyle numuneyi eşit dağıtır; açık çerçeve gövdesi çalışma tezgâhında az yer kaplar.\n\nDayanıklı ATH gövde ve rulmanlı mil yatağı ile dengeli dönüş sağlar. Ön paneldeki güç kontrolü ile cihazı hızlıca çalıştırıp durdurabilirsiniz.\n\nRenk seçenekleri: Standart üretim gri / siyah tonlarındadır. Özel renk talepleriniz için lütfen bizimle iletişime geçin.",
    highlights: [
      "Y-tipi kap ile homojen toz / granül karıştırma",
      "Kompakt masaüstü laboratuvar form faktörü",
      "Rulmanlı mil ve dengeli dönüş",
      "Ön panel güç kontrolü",
      "ATH markalı endüstriyel gövde",
      "Gri / siyah standart; özel renk için iletişime geçin",
    ],
    price: 0,
    currency: "TRY",
    stockStatus: "coming_soon",
    category: "lab-equipment",
    images: [
      {
        src: "/images/store/ath-y-karistirici-1.png",
        alt: "ATH Y-tipi laboratuvar karıştırıcı yan görünüm",
      },
      {
        src: "/images/store/ath-y-karistirici-2.png",
        alt: "ATH Y-tipi laboratuvar karıştırıcı ve numune kapları",
      },
      {
        src: "/images/store/ath-y-karistirici-3.png",
        alt: "ATH Y-tipi laboratuvar karıştırıcı çift açı görünümü",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "Laboratuvar / Atölye / Eğitim",
      assemblyTime: "Kurulumsuz (tak-çalıştır masaüstü cihaz)",
      material: "ATH dayanıklı gövde (gri / siyah; özel renk talep üzerine)",
      microcontroller: "Dahili motor sürücü + ön panel güç kontrolü",
    },
    bomList: {
      printedParts: ["1x ATH Y-tipi laboratuvar karıştırıcı (montajlı)"],
      electronicParts: [
        "Dahili motor ve aktarım grubu",
        "Rulmanlı mil yatakları",
        "Ön panel güç anahtarı / kontrol ünitesi",
      ],
      digitalAccess: [
        "Kısa kullanım kılavuzu",
        "Özel renk talebi için iletişim yönlendirmesi",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      kitVersionStatus: "none",
      curriculumPreview: [],
    },
  },
] as const;

export const STORE_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "education-kit": "Eğitim Kitleri",
  "ready-device": "Hazır Cihazlar (Tak-Çalıştır)",
  "lab-equipment": "Laboratuvar Ekipmanları",
  "display-presentation": "Sunum / Sergileme",
  "3d-design-part": "3D Tasarım Parçaları",
  electronics: "Elektronik & Modüller",
  bundle: "Avantajlı Setler (Bundle)",
};

/** Compact labels for product card badges. */
export const STORE_CATEGORY_CARD_LABELS: Record<ProductCategory, string> = {
  "education-kit": "Eğitim Kiti",
  "ready-device": "Tak-Çalıştır",
  "lab-equipment": "Laboratuvar",
  "display-presentation": "Sunum",
  "3d-design-part": "3D Parça",
  electronics: "Elektronik",
  bundle: "Set",
};

export const STORE_DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  "Başlangıç",
  "Orta",
  "İleri",
];

export function getStoreProductBySlug(slug: string): Product | undefined {
  return STORE_PRODUCTS.find((product) => product.slug === slug);
}

export function getAllStoreProductSlugs(): string[] {
  return STORE_PRODUCTS.map((product) => product.slug);
}
