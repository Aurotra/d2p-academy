import type { Product, ProductCategory, DifficultyLevel } from "@/core/domain/store";

export const STORE_PRODUCTS: readonly Product[] = [
  {
    id: "prod-demo-urun",
    slug: "demo-urun",
    title: "Demo Ürün",
    subtitle: "Tüm mağaza özelliklerini gösteren örnek eğitim kiti",
    description:
      "Bu ürün yalnızca vitrin demosudur. Stok rozeti, zorluk, dijital eğitim, aktivasyon kodu, kutu içeriği (3D / elektronik / dijital), müfredat adımları ve satın alma butonunu birlikte görmeniz için hazırlanmıştır.",
    price: 1450,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "education-kit",
    images: [
      {
        src: "/images/store/radar-kit.svg",
        alt: "Demo Ürün teknik görünümü",
      },
    ],
    specs: {
      difficulty: "Orta",
      ageGroup: "10+ Yaş",
      assemblyTime: "90 Dakika",
      material: "PLA+ / PETG",
      microcontroller: "Arduino Nano / ESP32 Uyumlu",
    },
    bomList: {
      printedParts: [
        "Örnek 3D baskı gövde parçası",
        "Örnek servo yatağı",
        "Örnek sensör braketi",
        "Örnek taban plakası",
      ],
      electronicParts: [
        "Geliştirme kartı (USB kablo dahil)",
        "Örnek ultrasonik sensör",
        "Örnek mikro servo",
        "Breadboard ve jumper seti",
      ],
      digitalAccess: [
        "İnteraktif video eğitim modülü",
        "3D adım adım montaj şeması",
        "Hazır kaynak kodları",
        "Canlı arayüz yazılımı",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: true,
      courseId: "course-demo-001",
      demoActivationCode: "D2P-DEMO-2026",
      curriculumPreview: [
        {
          step: 1,
          title: "Mekanik gövde ve bağlantı parçalarının montajı",
          duration: "25 dk",
          type: "mechanical",
        },
        {
          step: 2,
          title: "Sensör ve servo pin bağlantıları",
          duration: "20 dk",
          type: "electronics",
        },
        {
          step: 3,
          title: "Kontrol yazılımının yüklenmesi",
          duration: "25 dk",
          type: "software",
        },
        {
          step: 4,
          title: "Kalibrasyon ve canlı test",
          duration: "20 dk",
          type: "software",
        },
      ],
    },
    purchaseUrl: "https://www.shopier.com/d2p/demo-urun",
  },
  {
    id: "prod-fennec-planespotter",
    slug: "fennec-planespotter",
    title: "Fennec PlaneSpotter (Tak-Çalıştır)",
    subtitle:
      "Fennec marka PlaneSpotter modeli: bölgenizdeki gerçek zamanlı hava trafiğini Wi-Fi üzerinden canlı izleyen masaüstü uçuş radarı.",
    description:
      "Fennec PlaneSpotter, montajı tamamlanmış ve yazılımı yüklenmiş hazır cihazdır. Type-C ile güç verip Wi-Fi üzerinden canlı uçuş verilerini ekranda takip edin. Kendin Yap (DIY) eğitim kiti versiyonu yakında eklenecektir.",
    price: 2450,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "ready-device",
    images: [
      {
        src: "/images/store/flight-radar-device.svg",
        alt: "Fennec PlaneSpotter masaüstü uçuş radarı teknik görünümü",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "Genel / Havacılık Meraklıları",
      assemblyTime: "Kurulumsuz (Tak-Çalıştır)",
      material: "Özel Tasarım PLA+ / PETG Kasa",
      microcontroller: "Dahili Wi-Fi SoC (ESP32 Tabanlı)",
    },
    bomList: {
      printedParts: ["Özel Tasarım Masaüstü Radar Monitör Kasası (Montajlı)"],
      electronicParts: [
        "Kurulu ve Test Edilmiş Radar Ünitesi (Entegre Ekran + Wi-Fi Modülü)",
        "Type-C Güç ve Veri Kablosu",
      ],
      digitalAccess: [
        "Hızlı Wi-Fi ve Bölge (Koordinat) Ayar Kılavuzu",
        "OTA (Kablosuz) Yazılım Güncelleme Desteği",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      kitVersionStatus: "coming_soon",
      curriculumPreview: [],
    },
    purchaseUrl: "https://www.shopier.com/d2p/fennec-planespotter",
  },
] as const;

export const STORE_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "education-kit": "Eğitim Kitleri",
  "ready-device": "Hazır Cihazlar (Tak-Çalıştır)",
  "3d-design-part": "3D Tasarım Parçaları",
  electronics: "Elektronik & Modüller",
  bundle: "Avantajlı Setler (Bundle)",
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
