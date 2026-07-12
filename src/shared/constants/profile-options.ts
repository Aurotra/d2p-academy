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
  { id: "avatar-1", src: "/avatars/avatar-1.png", label: "Yıldız" },
  { id: "avatar-2", src: "/avatars/avatar-2.png", label: "Robot" },
  { id: "avatar-3", src: "/avatars/avatar-3.png", label: "Lale" },
  { id: "avatar-4", src: "/avatars/avatar-4.png", label: "Kelebek" },
  { id: "avatar-5", src: "/avatars/avatar-5.png", label: "3D Yazıcı" },
  { id: "avatar-6", src: "/avatars/avatar-6.png", label: "Taç" },
  { id: "avatar-7", src: "/avatars/avatar-7.png", label: "Araba" },
  { id: "avatar-8", src: "/avatars/avatar-8.png", label: "Futbol Topu" },
] as const;

export const LIKERT_OPTIONS = [
  { value: 1, label: "1 - Çok düşük" },
  { value: 2, label: "2" },
  { value: 3, label: "3 - Orta" },
  { value: 4, label: "4" },
  { value: 5, label: "5 - Çok yüksek" },
] as const;
