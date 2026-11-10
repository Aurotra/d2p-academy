import type { Product, ProductCategory, DifficultyLevel } from "@/core/domain/store";

export const STORE_PRODUCTS: readonly Product[] = [
  {
    id: "prod-radar-kit",
    slug: "masaustu-ultrasonik-radar-kiti",
    title: "D2P Masaüstü Ultrasonik Radar & Tarama Kiti",
    subtitle: "Servo kule + HC-SR04 ile masaüstü engel taraması",
    description:
      "Ultrasonik mesafe ölçümü, servo tarama ve canlı radar arayüzünü bir araya getiren eğitim kiti. Mekanik montajdan yazılım kalibrasyonuna kadar uçtan uca bir mühendislik döngüsü sunar.",
    price: 1450,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "education-kit",
    images: [
      {
        src: "/images/store/radar-kit.svg",
        alt: "D2P Masaüstü Ultrasonik Radar Kiti Teknik Görünümü",
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
        "PLA+ Radar Kulesi Ana Gövdesi",
        "PETG Servo Motor Yatağı",
        "HC-SR04 Sensör Tutucu Braket",
        "Kaymaz Masaüstü Taban Plakası",
      ],
      electronicParts: [
        "Geliştirme Kartı (USB Kablo Dahil)",
        "HC-SR04 Ultrasonik Mesafe Sensörü",
        "SG90 180° Mikro Servo Motor",
        "Breadboard ve 20x Jumper Kablo Seti",
      ],
      digitalAccess: [
        "D2P İnteraktif Video Eğitim Modülü",
        "3D Adım Adım Montaj Şeması",
        "Hazır Arduino/ESP32 Kaynak Kodları",
        "Canlı Radar Arayüz Yazılımı",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: true,
      courseId: "course-radar-101",
      demoActivationCode: "D2P-RADAR-2026",
      curriculumPreview: [
        {
          step: 1,
          title: "3D Baskı Gövde ve Servo Mekanizma Montajı",
          duration: "25 dk",
          type: "mechanical",
        },
        {
          step: 2,
          title: "HC-SR04 Sensör ve Servo Pin Bağlantıları",
          duration: "20 dk",
          type: "electronics",
        },
        {
          step: 3,
          title: "Tarama Algoritması ve Açı-Mesafe Kodunun Yüklenmesi",
          duration: "25 dk",
          type: "software",
        },
        {
          step: 4,
          title: "Radar Ekranı Kalibrasyonu ve Engel Tespiti Testi",
          duration: "20 dk",
          type: "software",
        },
      ],
    },
    purchaseUrl: "https://www.shopier.com/d2p/masaustu-ultrasonik-radar-kiti",
  },
  {
    id: "prod-gripper-kit",
    slug: "biyonik-robotik-kiskac-kiti",
    title: "Biyonik Robotik Kıskaç (Gripper) Mekanik + Servo Kiti",
    subtitle: "Dişli senkron ve oransal PWM tutuş kontrolü",
    description:
      "Paralel mekanizma, metal dişli servo ve potansiyometre ile hassas tutuş çalıştıran ileri seviye robotik kıskaç kiti. Kinematik, tork ve nesne yakalama testlerini kapsar.",
    price: 1150,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "education-kit",
    images: [
      {
        src: "/images/store/gripper-kit.svg",
        alt: "Biyonik Robotik Kıskaç Mekanizması Görünümü",
      },
    ],
    specs: {
      difficulty: "İleri",
      ageGroup: "12+ Yaş",
      assemblyTime: "120 Dakika",
      material: "PETG / Karbon Fiber Takviyeli PLA",
      microcontroller: "Arduino / ESP32 PWM Uyumlu",
    },
    bomList: {
      printedParts: [
        "Senkronize Dişli Çark Çifti",
        "Biyonik Parmak Mafsalları (4 Parça)",
        "Servo Gövde Şasisi",
        "M3 Bağlantı Burçları",
      ],
      electronicParts: [
        "MG996R Metal Dişli Yüksek Torklu Servo",
        "Potansiyometre Kontrol Modülü",
        "Harici Güç Dağıtım Kartı ve Kablo Seti",
      ],
      digitalAccess: [
        "Kinematik ve Dişli Oranı Eğitim Videosu",
        "3D Patlatılmış Montaj Kılavuzu",
        "Hassas Tutuş (PWM) Kontrol Kodları",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: true,
      courseId: "course-gripper-102",
      demoActivationCode: "D2P-GRIP-2026",
      curriculumPreview: [
        {
          step: 1,
          title: "Paralel Mekanizma ve Dişli Çarkların Kurulumu",
          duration: "35 dk",
          type: "mechanical",
        },
        {
          step: 2,
          title: "Yüksek Torklu Servo ve Potansiyometre Devresi",
          duration: "25 dk",
          type: "electronics",
        },
        {
          step: 3,
          title: "Analog Okuma ile Oransal Kıskaç Kontrol Yazılımı",
          duration: "30 dk",
          type: "software",
        },
        {
          step: 4,
          title: "Farklı Geometrili Nesneleri Yakalama ve Tork Testi",
          duration: "30 dk",
          type: "mechanical",
        },
      ],
    },
    purchaseUrl: "https://www.shopier.com/d2p/biyonik-robotik-kiskac-kiti",
  },
  {
    id: "prod-test-stand",
    slug: "moduler-elektronik-test-standi",
    title: "Modüler Elektronik Prototipleme ve Sensör Test Standı",
    subtitle: "Arduino / ESP32 kızaklı düzenli atölye tablası",
    description:
      "Geliştirme kartı, breadboard ve sensörleri sabit tutan PETG prototipleme standı. Atölye masasında kablo karmaşasını azaltır; montajı birkaç dakika sürer.",
    price: 450,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "3d-design-part",
    images: [
      {
        src: "/images/store/test-stand.svg",
        alt: "Modüler Elektronik Prototipleme Standı",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "8+ Yaş ve Yetişkin",
      assemblyTime: "15 Dakika",
      material: "Endüstriyel PETG",
    },
    bomList: {
      printedParts: [
        "Ana Prototipleme Tabla Gövdesi",
        "Arduino Uno/Nano/ESP32 Kızaklı Yuvalar",
        "Breadboard Sabitleme Çerçevesi",
        "Sensör Açı Aparatları (3 Adet)",
      ],
      electronicParts: [],
      digitalAccess: [],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      curriculumPreview: [],
    },
    purchaseUrl: "https://www.shopier.com/d2p/moduler-elektronik-test-standi",
  },
  {
    id: "prod-electronics-pack",
    slug: "sensor-ve-aktuator-elektronik-paketi",
    title: "D2P Sensör ve Aktüatör Başlangıç Paketi (ESP32 / Arduino Uyumlu)",
    subtitle: "Temel sensör, servo ve jumper seti",
    description:
      "Ultrasonik, sıcaklık/nem, ışık ve servo motor deneyleri için derlenmiş elektronik paket. Kart seçiminden bağımsız pin diyagramı özeti ile birlikte gelir.",
    price: 850,
    currency: "TRY",
    stockStatus: "in_stock",
    category: "electronics",
    images: [
      {
        src: "/images/store/electronics-pack.svg",
        alt: "D2P Sensör ve Aktüatör Elektronik Paketi",
      },
    ],
    specs: {
      difficulty: "Başlangıç",
      ageGroup: "9+ Yaş",
      assemblyTime: "30 Dakika",
      material: "PCB / Elektronik Komponent",
      microcontroller: "ESP32 & Arduino Tam Uyumlu",
    },
    bomList: {
      printedParts: ["Komponent Saklama ve Sınıflandırma Kutusu (PLA)"],
      electronicParts: [
        "HC-SR04 Ultrasonik Sensör",
        "2x SG90 Servo Motor",
        "DHT11 Sıcaklık/Nem Sensörü",
        "LDR Işık Sensörü ve Buzzer Modülü",
        "40 Pin Ayrılabilir Jumper Kablo ve Breadboard",
      ],
      digitalAccess: ["Hızlı Pin Diyagramı (PDF Özeti)"],
    },
    educationIntegration: {
      hasDigitalCourse: false,
      curriculumPreview: [],
    },
    purchaseUrl: "https://www.shopier.com/d2p/sensor-ve-aktuator-elektronik-paketi",
  },
  {
    id: "prod-full-bundle",
    slug: "genc-muhendis-tam-donanim-bundle",
    title: "Genç Mühendis Tam Donanım Seti (Radar Kiti + Kıskaç Kiti + Test Standı)",
    subtitle: "Radar + kıskaç + stand: birleşik final projesi",
    description:
      "Radar tarama, biyonik kıskaç ve prototipleme standını tek sette birleştirir. Final projesinde tespit edilen nesneyi kıskaçla yakalama senaryosuna kadar ilerler.",
    price: 2750,
    currency: "TRY",
    stockStatus: "pre_order",
    category: "bundle",
    images: [
      {
        src: "/images/store/full-bundle.svg",
        alt: "Genç Mühendis Tam Donanım Eğitim Seti",
      },
    ],
    specs: {
      difficulty: "Orta",
      ageGroup: "10+ Yaş",
      assemblyTime: "225 Dakika (Toplam)",
      material: "PLA+ / PETG Hibrit Set",
      microcontroller: "Çift Geliştirme Kartı Dahil",
    },
    bomList: {
      printedParts: [
        "Masaüstü Radar Kiti Tüm 3D Parçaları",
        "Biyonik Robotik Kıskaç Tüm 3D Parçaları",
        "Modüler Elektronik Prototipleme ve Test Standı",
      ],
      electronicParts: [
        "Radar Kiti Tam Elektronik Seti",
        "Kıskaç Kiti Tam Elektronik ve Metal Dişli Servo Seti",
        "Ekstra Yedek Jumper, Vida ve Bağlantı Ekipmanları",
      ],
      digitalAccess: [
        "Radar Kiti Tam Eğitim Modülü Erişimi",
        "Biyonik Kıskaç Tam Eğitim Modülü Erişimi",
        "Birleştirilmiş Otonom İstasyon Final Projesi Rehberi",
      ],
    },
    educationIntegration: {
      hasDigitalCourse: true,
      courseId: "course-bundle-full",
      demoActivationCode: "D2P-FULL-2026",
      curriculumPreview: [
        {
          step: 1,
          title: "Modüler Test Standı Kurulumu ve Atölye Hazırlığı",
          duration: "15 dk",
          type: "mechanical",
        },
        {
          step: 2,
          title: "Modül 1: Masaüstü Ultrasonik Radar Montajı ve Yazılımı",
          duration: "90 dk",
          type: "electronics",
        },
        {
          step: 3,
          title: "Modül 2: Biyonik Kıskaç Mekanizması ve Servo Kontrolü",
          duration: "90 dk",
          type: "mechanical",
        },
        {
          step: 4,
          title: "Final Projesi: Radar ile Tespit Edilen Nesneyi Kıskaçla Yakalama",
          duration: "45 dk",
          type: "software",
        },
      ],
    },
    purchaseUrl: "https://www.shopier.com/d2p/genc-muhendis-tam-donanim-bundle",
  },
] as const;

export const STORE_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "education-kit": "Eğitim Kitleri",
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
