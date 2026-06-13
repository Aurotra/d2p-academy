import Link from "next/link";

import { Button } from "@/presentation/components/ui/button";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-4 pb-28 pt-16 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_55%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Geleceğin Maker&apos;ları Burada Yetişiyor
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Robotik, yazılım ve maker atölyeleriyle{" "}
            <span className="text-cyan-300">üretmeyi öğren.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cyan-100/80 sm:text-lg">
            D2P Academy; okullara, öğrencilere ve girişimcilere yönelik modern bir eğitim
            platformudur. Canlı etkinlikler, doğrulanabilir sertifikalar ve öğrenci paneli tek
            ekosistemde.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button className="w-full sm:w-auto">Hemen Kayıt Ol</Button>
            </Link>
            <a href="#events">
              <Button variant="secondary" className="w-full sm:w-auto">
                Etkinlik Takvimini Gör
              </Button>
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div>
              <dt className="text-2xl font-bold text-white">500+</dt>
              <dd className="text-sm text-cyan-100/70">Mezun Öğrenci</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-white">120+</dt>
              <dd className="text-sm text-cyan-100/70">Etkinlik</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-white">40+</dt>
              <dd className="text-sm text-cyan-100/70">Okul İş Birliği</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <div className="rounded-[2rem] border border-cyan-400/20 bg-white/5 p-6 backdrop-blur-sm">
            <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-8 ring-1 ring-cyan-400/20">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Teknoloji Odaklı LMS
              </p>
              <p className="mt-4 text-2xl font-bold text-white">
                Web + mobil uygulama için API-driven altyapı
              </p>
              <ul className="mt-6 space-y-3 text-sm text-cyan-100/80">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Supabase ile güvenli kimlik doğrulama
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Doğrulanabilir sertifika sistemi
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
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
