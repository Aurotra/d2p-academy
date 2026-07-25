export interface ProgramCodeOption {
  code: string;
  label: string;
}

/** Program codes aligned with certificate / event program_code usage. */
export const PROGRAM_CODE_OPTIONS: ProgramCodeOption[] = [
  { code: "DC", label: "Design Camp (DC)" },
  { code: "TT", label: "Teknoloji Atölyesi (TT)" },
  { code: "YK", label: "Yaz Kampı (YK)" },
  { code: "YT", label: "Yazılım Temelleri (YT)" },
  { code: "IM", label: "İleri Maker (IM)" },
  { code: "KYK", label: "Kış Yoğun Kamp (KYK)" },
  { code: "ADV", label: "İleri 3D (ADV)" },
];

export function getProgramCodeLabel(code: string): string {
  const match = PROGRAM_CODE_OPTIONS.find((option) => option.code === code);
  return match?.label ?? code;
}
