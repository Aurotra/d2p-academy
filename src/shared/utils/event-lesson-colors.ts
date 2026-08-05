/** Yoklama ders butonları — her ders farklı renk (12’ye kadar benzersiz, sonra döngü). */
export const LESSON_BUTTON_PALETTE = [
  { ring: "ring-sky-400", solid: "bg-sky-600 text-white", soft: "border-sky-300 bg-sky-50 text-sky-900" },
  { ring: "ring-emerald-400", solid: "bg-emerald-600 text-white", soft: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  { ring: "ring-violet-400", solid: "bg-violet-600 text-white", soft: "border-violet-300 bg-violet-50 text-violet-900" },
  { ring: "ring-amber-400", solid: "bg-amber-500 text-white", soft: "border-amber-300 bg-amber-50 text-amber-950" },
  { ring: "ring-rose-400", solid: "bg-rose-600 text-white", soft: "border-rose-300 bg-rose-50 text-rose-900" },
  { ring: "ring-cyan-400", solid: "bg-cyan-600 text-white", soft: "border-cyan-300 bg-cyan-50 text-cyan-900" },
  { ring: "ring-orange-400", solid: "bg-orange-500 text-white", soft: "border-orange-300 bg-orange-50 text-orange-950" },
  { ring: "ring-indigo-400", solid: "bg-indigo-600 text-white", soft: "border-indigo-300 bg-indigo-50 text-indigo-900" },
  { ring: "ring-teal-400", solid: "bg-teal-600 text-white", soft: "border-teal-300 bg-teal-50 text-teal-900" },
  { ring: "ring-fuchsia-400", solid: "bg-fuchsia-600 text-white", soft: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900" },
  { ring: "ring-lime-400", solid: "bg-lime-600 text-white", soft: "border-lime-300 bg-lime-50 text-lime-950" },
  { ring: "ring-pink-400", solid: "bg-pink-600 text-white", soft: "border-pink-300 bg-pink-50 text-pink-900" },
] as const;

export function getLessonButtonPalette(sessionIndex: number) {
  return LESSON_BUTTON_PALETTE[(sessionIndex - 1) % LESSON_BUTTON_PALETTE.length];
}
