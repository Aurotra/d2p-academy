import type { Product, ProductCategory, DifficultyLevel } from "@/core/domain/store";

export const STORE_PRODUCTS: readonly Product[] = [
  {
    id: "prod-fennec-planespotter",
    slug: "fennec-planespotter-masaustu-ucak-izleme-cihazi",
    title: "Fennec PlaneSpotter",
    subtitle: "Canlı Masaüstü Uçak İzleme Radarı",
    description:
      "Üstünüzden geçen uçakları gerçek zamanlı olarak masanızda görün. Fennec PlaneSpotter, bulunduğunuz bölgedeki hava trafiğini ekranına taşıyan tak-çalıştır bir masaüstü radar cihazıdır.\n\nType-C ile güce bağlayın, Wi-Fi üzerinden konumunuzu girin; belirlediğiniz alana giren uçakları anında takip edin. Sesli ve titreşimli ikaz sayesinde ekrana bakmasanız bile gökyüzündeki hareketi kaçırmazsınız.\n\nMontaj veya teknik kurulum yok. Kutudan çıkar çıkmaz çalışır; dış kabuktan yazılımına kadar %100 Fennec tasarımı ve üretimi.",
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
        src: "/images/store/fennec-planespotter.jpg",
        alt: "Fennec PlaneSpotter canlı masaüstü uçak izleme radarı",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "Genel / Havacılık Meraklıları",
      assemblyTime: "Kurulumsuz (Tam Çalıştır / Plug & Play)",
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
