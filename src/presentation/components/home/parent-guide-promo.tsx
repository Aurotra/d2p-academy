import Link from "next/link";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

const quickSteps = [
  "Hesap oluştur, e-postanı onayla",
  "Çocuk hesabı ekle",
  "Etkinliğe kaydet → Formları doldur (Tanışma, Onaylar)",
];

export function ParentGuidePromo() {
  return (
    <div id="veli-rehberi" className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Veli kaydı
      </p>
      <h3 className="mt-1 text-base font-bold text-navy-950">3 adımda kayıt</h3>

      <ol className="relative mt-4 space-y-0">
        {quickSteps.map((step, index) => (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {index < quickSteps.length - 1 ? (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-emerald-200"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5 text-sm leading-5 text-slate-700">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 space-y-2">
        <AuthPortalLink href="/register" kind="parent" block className="py-2.5 text-sm">
          Hemen Hesap Oluştur
        </AuthPortalLink>
        <Link
          href={PARENT_GUIDE_PATH}
          className="inline-flex w-full items-center justify-center rounded-xl border border-secondary/30 bg-white px-4 py-2.5 text-sm font-semibold text-secondary transition hover:border-secondary hover:bg-emerald-50/50"
        >
          Veli Rehberi →
        </Link>
        <Link
          href={PARENT_GUIDE_PATH}
          className="block text-center text-xs font-medium text-slate-500 hover:text-secondary"
        >
          SSS ve detaylı anlatım
        </Link>
      </div>
    </div>
  );
}
