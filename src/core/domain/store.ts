export type ProductCategory = "education-kit" | "3d-design-part" | "electronics" | "bundle";

export type StockStatus = "in_stock" | "pre_order" | "out_of_stock";

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
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency: "TRY";
  stockStatus: StockStatus;
  category: ProductCategory;
  images: ProductImage[];
  specs: ProductSpecs;
  bomList: ProductBomList;
  educationIntegration: ProductEducationIntegration;
  purchaseUrl: string;
}
