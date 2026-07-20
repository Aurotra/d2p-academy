import Link from "next/link";

import { AuthPortalLink } from "@/presentation/components/auth/auth-portal-link";
import { PARENT_GUIDE_PATH } from "@/shared/constants/parent-guide";

const quickSteps = [
  "Hesap Oluştur → e-postanı onayla",
  "Çocuk hesabı ekle (ad, doğum tarihi, şifre)",
  "Etkinliğe kaydet ve formları doldur",
];

export function ParentGuidePromo() {
  return (
    <div id="veli-rehberi" className="flex h-full scroll-mt-24 flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
        Veli kaydı
      </p>
      <h3 className="mt-2 text-lg font-bold text-navy-950 sm:text-xl">Nasıl kayıt olurum?</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Etkinliğe kayıt için önce veli hesabı açılır; ardından çocuk hesabı eklenir ve kayıt
        tamamlanır.
      </p>

      <ol className="mt-5 flex-1 space-y-3">
        {quickSteps.map((step, index) => (
          <li
            key={step}
            className="flex gap-3 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2.5 text-sm text-slate-700"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5 leading-5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col gap-2.5 border-t border-emerald-100 pt-5">
        <Link
          href={PARENT_GUIDE_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-hover"
        >
          Veli Kayıt Tanıtımı →
        </Link>
        <AuthPortalLink href="/register" kind="parent" block className="py-2.5">
          Hemen Hesap Oluştur
        </AuthPortalLink>
        <Link
          href={PARENT_GUIDE_PATH}
          className="text-center text-xs font-semibold text-secondary hover:text-secondary-hover"
        >
          SSS ve detaylı anlatım
        </Link>
      </div>
    </div>
  );
}
