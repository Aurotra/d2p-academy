export function getChipGridClass(optionCount: number): string {
  if (optionCount <= 2) {
    return "grid grid-cols-2 gap-2";
  }

  return "grid grid-cols-1 gap-2 sm:grid-cols-2";
}

export function getChipButtonClass(isSelected: boolean, options?: { centered?: boolean }): string {
  const alignment = options?.centered ? "text-center" : "text-left";

  return `min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold leading-snug transition ${alignment} ${
    isSelected
      ? "border border-document-primary bg-document-primary text-white"
      : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300"
  }`;
}
