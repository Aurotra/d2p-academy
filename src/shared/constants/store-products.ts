import type { Product, ProductCategory, DifficultyLevel } from "@/core/domain/store";

export const STORE_PRODUCTS: readonly Product[] = [
  {
    id: "prod-fennec-planespotter",
    slug: "fennec-planespotter-masaustu-ucak-izleme-cihazi",
    title: "Fennec PlaneSpotter — Canlı Masaüstü Uçak İzleme Radarı",
    subtitle:
      "Type-C ile çalışan, Wi-Fi üzerinden konumunuzu girerek üstünüzden geçen uçakları sesli ve titreşimli ikazlarla canlı takip etmenizi sağlayan, %100 Fennec imzalı masaüstü radar cihazı.",
    description:
      "Gökyüzündeki canlı trafiği masanıza taşıyın. Fennec PlaneSpotter, bulunduğunuz bölgenin üstünden geçen ticari uçakları ve hava araçlarını gerçek zamanlı olarak ekranına taşıyan akıllı bir masaüstü izleme cihazıdır. Kurulum veya teknik montaj gerektirmeyen Tam Çalıştır yapısı sayesinde kutudan çıktığı anda çalışma masanızın en dikkat çekici teknoloji objesi olmaya hazırdır.\n\nSesli ve titreşimli akıllı ikaz sistemi: Gözünüz sürekli ekranda olmasa bile gökyüzündeki hareketliliği kaçırmazsınız. PlaneSpotter, belirlediğiniz kapsama alanına yeni bir uçak girdiğinde dahili titreşim motoru ve sesli uyarı sistemi ile sizi anında haberdar eder.\n\nSaniyeler içinde konumunuzu tanımlayın: Cihazı standart bir Type-C kablo ile güce bağladıktan sonra dahili Wi-Fi arayüzü üzerinden kendi konumunuzu veya takip etmek istediğiniz bölge koordinatını kolayca girebilirsiniz. Belirlediğiniz yarıçap içerisindeki hava sahasını tarayarak üzerinizden geçen uçakları anlık olarak ekranına yansıtır.\n\n%100 Fennec tasarımı ve mühendisliği: Dış kabuk tasarımından gömülü radar yazılımına ve donanım mimarisine kadar her detay tamamen Fennec bünyesinde geliştirilmiş ve üretilmiştir.\n\nÖne çıkan özellikler: Gerçek zamanlı hava sahası takibi; sesli ve titreşimli ikaz; kolay Wi-Fi kurulumu; tak-çalıştır Type-C güç girişi; %100 Fennec imzası.",
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
    purchaseUrl: "https://www.shopier.com/d2p/fennec-planespotter-masaustu-ucak-izleme-cihazi",
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
