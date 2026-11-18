export type ProductCategory =
  | "education-kit"
  | "ready-device"
  | "lab-equipment"
  | "display-presentation"
  | "3d-design-part"
  | "electronics"
  | "bundle";

export type KitVersionStatus = "available" | "coming_soon" | "none";

export type StockStatus = "in_stock" | "pre_order" | "out_of_stock" | "coming_soon";

export type DifficultyLevel = "Başlangıç" | "Orta" | "İleri";

export type CurriculumStepType = "mechanical" | "electronics" | "software";

export interface CurriculumStep {
  step: number;
  title: string;
  duration: string;
  type: CurriculumStepType;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductSpecs {
  difficulty: DifficultyLevel;
  ageGroup: string;
  assemblyTime: string;
  material: string;
  microcontroller?: string;
}

export interface ProductBomList {
  printedParts: string[];
  electronicParts: string[];
  digitalAccess: string[];
}

export interface ProductEducationIntegration {
  hasDigitalCourse: boolean;
  courseId?: string;
  demoActivationCode?: string;
  curriculumPreview: CurriculumStep[];
  /** Ready devices may later ship a DIY education-kit version. */
  kitVersionStatus?: KitVersionStatus;
  /** When kitVersionStatus is available, points at the DIY kit product slug. */
  linkedKitSlug?: string;
}

export interface Product {
  id: string;
  slug: string;
  /** Brand shown in schema / merchandising (defaults to D2P Academy). */
  brand?: string;
  /** Product name shown as H1 on the detail page. */
  title: string;
  /** Short sales tagline under the title. */
  subtitle: string;
  /** Longer product story for the detail page body. */
  description: string;
  /** Bullet benefits shown like typical e-commerce PDPs. */
  highlights?: readonly string[];
  price: number;
  currency: "TRY";
  stockStatus: StockStatus;
  category: ProductCategory;
  images: ProductImage[];
  specs: ProductSpecs;
  bomList: ProductBomList;
  educationIntegration: ProductEducationIntegration;
  /** @deprecated Shopier dış link; yeni akış sitede PayTR checkout kullanır. */
  purchaseUrl?: string;
}
