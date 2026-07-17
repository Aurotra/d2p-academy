import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { HeroCtaButtons } from "@/presentation/components/home/hero-cta-buttons";

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

      <div className="relative mx-auto max-w-7xl">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sky-300 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
            Yeni Nesil Mühendislik ve Tasarım Akademisi
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-sky-950 sm:text-5xl lg:text-6xl">
            Fikirlerini Tasarıma,{" "}
            <span className="text-sky-700">Tasarımlarını Gerçek Çözümlere Dönüştür!</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-sky-900/80 sm:text-lg">
            D2P (Düşün-Tasarla-Üret-Test Et) modeliyle; sadece teknolojiyi öğrenen değil,
            çevrelerindeki problemlere 3D tasarımlarla çözümler geliştiren ve ürettiği çözümleri
            gerçek hayatta uygulayan geleceğin mühendislerini yetiştiriyoruz.
          </p>

          <HeroCtaButtons />

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-sky-300/60 pt-8">
            <div>
              <dt className="text-2xl font-bold text-sky-950">250+</dt>
              <dd className="text-sm text-sky-800/80">Öğrenci</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-sky-950">2</dt>
              <dd className="text-sm text-sky-800/80">Etkinlik</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-sky-950">3</dt>
              <dd className="text-sm text-sky-800/80">Okul İş Birliği</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
