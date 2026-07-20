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
    <aside
      id="veli-rehberi"
      className="rounded-[1.75rem] border border-secondary/25 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-lg shadow-secondary/10 lg:sticky lg:top-24"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
        Veliler için
      </p>
      <h2 className="mt-2 text-xl font-black text-navy-950 sm:text-2xl">Veli Kayıt Rehberi</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Çocuğunuzu etkinliğe kaydetmek, formları doldurmak ve sertifikayı takip etmek için adım
        adım rehberimizi kullanın.
      </p>

      <ol className="mt-5 space-y-2.5">
        {quickSteps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5 leading-5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={PARENT_GUIDE_PATH}
          className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/20 transition hover:bg-secondary-hover hover:shadow-glow-secondary"
        >
          Veli Kayıt Tanıtımı →
        </Link>
        <AuthPortalLink href="/register" kind="parent" block>
          Hemen Hesap Oluştur
        </AuthPortalLink>
        <Link
          href={PARENT_GUIDE_PATH}
          className="text-center text-sm font-semibold text-secondary hover:text-secondary-hover"
        >
          SSS ve detaylı anlatım
        </Link>
      </div>
    </aside>
  );
}
