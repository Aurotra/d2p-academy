import type { CurriculumStepType, DifficultyLevel, StockStatus } from "@/core/domain/store";

export function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "Stokta";
    case "pre_order":
      return "Ön Sipariş";
    case "out_of_stock":
      return "Tükendi";
  }
}

export function stockStatusClass(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "border-secondary/30 bg-secondary/10 text-secondary";
    case "pre_order":
      return "border-accent-dark/30 bg-accent/20 text-accent-dark";
    case "out_of_stock":
      return "border-border-surface bg-surface-section text-subtle";
  }
}

export function difficultyClass(level: DifficultyLevel): string {
  switch (level) {
    case "Başlangıç":
      return "border-secondary/25 bg-secondary/10 text-secondary";
    case "Orta":
      return "border-document-primary/25 bg-document-primary/10 text-document-primary";
    case "İleri":
      return "border-primary/25 bg-primary/10 text-primary";
  }
}

export function curriculumTypeLabel(type: CurriculumStepType): string {
  switch (type) {
    case "mechanical":
      return "Mekanik";
    case "electronics":
      return "Elektronik";
    case "software":
      return "Yazılım";
  }
}
