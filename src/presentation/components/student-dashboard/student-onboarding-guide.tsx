import Link from "next/link";

import { Button } from "@/presentation/components/ui/button";

export function StudentOnboardingGuide() {
  return (
    <div className="rounded-[2rem] border border-border-surface bg-gradient-to-br from-surface-section via-white to-surface-tint-mixed p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-900">
        Hoş geldin
      </p>
      <h2 className="mt-2 text-2xl font-bold text-navy-950">Henüz bir etkinliğe kayıtlı değilsin</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Öğrenci hesabına etkinlik kaydı velin, öğretmenin veya admin tarafından yapılır. Velin
        panelden çocuk hesabını ekleyip «Etkinliğe kaydet» adımını tamamladığında kayıtların burada
        görünür.
      </p>

      <ol className="mt-6 space-y-3 text-sm text-[var(--text-on-surface-soft)]">
        <li className="flex gap-3 rounded-xl border border-border-surface bg-white/80 px-4 py-3">
          <span className="font-bold text-navy-900">1.</span>
          <span>Velin aktif etkinliklere göz atar ve uygun programı seçer.</span>
        </li>
        <li className="flex gap-3 rounded-xl border border-border-surface bg-white/80 px-4 py-3">
          <span className="font-bold text-navy-900">2.</span>
          <span>Çocuk hesabın etkinliğe kaydedilir.</span>
        </li>
        <li className="flex gap-3 rounded-xl border border-border-surface bg-white/80 px-4 py-3">
          <span className="font-bold text-navy-900">3.</span>
          <span>Katılımcı formlarını birlikte doldurursunuz; ardından etkinlik detayları burada açılır.</span>
        </li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/etkinlikler">
          <Button type="button" variant="outline">
            Etkinlik takvimine bak
          </Button>
        </Link>
        <Link href="/veli-rehberi" className="inline-flex items-center text-sm font-semibold text-document-primary hover:underline">
          Veli rehberini oku →
        </Link>
      </div>
    </div>
  );
}
