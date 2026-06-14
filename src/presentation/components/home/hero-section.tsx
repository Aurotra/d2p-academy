import Link from "next/link";

import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { Button } from "@/presentation/components/ui/button";

export function HeroSection() {
  return (
    <section
      id="hero"
      className={`relative overflow-hidden ${BRAND_SURFACE_GRADIENT} px-4 pb-28 pt-16 sm:px-6 lg:px-8`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sky-300 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
            Geleceğin Maker&apos;ları Burada Yetişiyor
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-sky-950 sm:text-5xl lg:text-6xl">
            Robotik, yazılım ve maker atölyeleriyle{" "}
            <span className="text-sky-700">üretmeyi öğren.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-sky-900/80 sm:text-lg">
            D2P Academy; okullara, öğrencilere ve girişimcilere yönelik modern bir eğitim
            platformudur. Canlı etkinlikler, doğrulanabilir sertifikalar ve öğrenci paneli tek
            ekosistemde.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button className="w-full sm:w-auto">Hemen Kayıt Ol</Button>
            </Link>
            <a href="#events">
              <Button
                variant="secondary"
                className="w-full border-sky-300 bg-white text-sky-900 hover:bg-sky-50 sm:w-auto"
              >
                Etkinlik Takvimini Gör
              </Button>
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-sky-300/60 pt-8">
            <div>
              <dt className="text-2xl font-bold text-sky-950">500+</dt>
              <dd className="text-sm text-sky-800/80">Mezun Öğrenci</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-sky-950">120+</dt>
              <dd className="text-sm text-sky-800/80">Etkinlik</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-sky-950">40+</dt>
              <dd className="text-sm text-sky-800/80">Okul İş Birliği</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <div className="rounded-[2rem] border border-sky-200 bg-white/80 p-6 shadow-lg shadow-sky-200/50">
            <div className="rounded-3xl bg-gradient-to-br from-sky-200 to-sky-300 p-8 ring-1 ring-sky-300/60">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-800">
                Teknoloji Odaklı LMS
              </p>
              <p className="mt-4 text-2xl font-bold text-sky-950">
                Web + mobil uygulama için API-driven altyapı
              </p>
              <ul className="mt-6 space-y-3 text-sm text-sky-900/80">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Supabase ile güvenli kimlik doğrulama
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Doğrulanabilir sertifika sistemi
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Dinamik etkinlik takvimi
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
