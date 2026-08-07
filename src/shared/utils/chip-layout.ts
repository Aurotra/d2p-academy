const CHOICE_BUTTON_TOUCH =
  "touch-manipulation select-none transition duration-150 active:scale-[0.98]";

function getChoiceButtonStateClass(isSelected: boolean): string {
  return isSelected
    ? "border border-document-primary bg-document-primary text-white active:brightness-90"
    : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300 active:border-sky-400 active:bg-slate-100";
}

export function getChipGridClass(optionCount: number): string {
  if (optionCount <= 2) {
    return "grid grid-cols-2 gap-2";
  }

  return "grid grid-cols-1 gap-2 sm:grid-cols-2";
}

export function getChipButtonClass(isSelected: boolean, options?: { centered?: boolean }): string {
  const alignment = options?.centered ? "text-center" : "text-left";

  return `${CHOICE_BUTTON_TOUCH} min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold leading-snug ${alignment} ${getChoiceButtonStateClass(isSelected)}`;
}

export function getLikertButtonClass(isSelected: boolean): string {
  return `${CHOICE_BUTTON_TOUCH} min-h-11 w-full rounded-xl px-1.5 py-2 text-center text-xs font-semibold sm:px-2 ${getChoiceButtonStateClass(isSelected)}`;
}
