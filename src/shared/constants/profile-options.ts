export const GRADE_LEVEL_OPTIONS = [
  { value: "5", label: "5. Sınıf" },
  { value: "6", label: "6. Sınıf" },
  { value: "7", label: "7. Sınıf" },
  { value: "8", label: "8. Sınıf" },
  { value: "9", label: "9. Sınıf" },
  { value: "10", label: "10. Sınıf" },
  { value: "11", label: "11. Sınıf" },
  { value: "12", label: "12. Sınıf" },
  { value: "university", label: "Üniversite" },
  { value: "other", label: "Diğer" },
] as const;

export const CODING_EXPERIENCE_OPTIONS = [
  { value: "none", label: "Hiç" },
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
] as const;

export const INTEREST_OPTIONS = [
  "3D Tasarım",
  "Robotik",
  "Kodlama",
  "Elektronik",
  "Prototipleme",
  "Maker Atölyeleri",
  "Mühendislik",
  "Bilim ve Teknoloji",
] as const;

export const AVATAR_OPTIONS = [
  { id: "male-1", src: "/avatars/male-1.svg", label: "Erkek Avatar 1" },
  { id: "male-2", src: "/avatars/male-2.svg", label: "Erkek Avatar 2" },
  { id: "female-1", src: "/avatars/female-1.svg", label: "Kız Avatar 1" },
  { id: "female-2", src: "/avatars/female-2.svg", label: "Kız Avatar 2" },
] as const;

export const LIKERT_OPTIONS = [
  { value: 1, label: "1 - Çok düşük" },
  { value: 2, label: "2" },
  { value: 3, label: "3 - Orta" },
  { value: 4, label: "4" },
  { value: 5, label: "5 - Çok yüksek" },
] as const;
