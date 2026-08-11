import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import { HeroCtaButtons } from "@/presentation/components/home/hero-cta-buttons";

export function HeroSection() {
  return (
    <section
      id="hero"
      className={`relative overflow-hidden ${BRAND_SURFACE_GRADIENT} px-4 pb-28 pt-16 sm:px-6 lg:px-8`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-surface-tint-yellow blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-surface-tint-green blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(255_183_3/0.18),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-border-surface bg-white/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Yeni Nesil Mühendislik ve Tasarım Akademisi
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-navy-950 sm:text-5xl lg:text-6xl">
            Fikirlerini Tasarıma,{" "}
            <span className="text-primary">Tasarımlarını Gerçek Çözümlere Dönüştür!</span>
          </h1>
          <h2 className="mt-4 max-w-3xl text-lg font-semibold text-navy-900 sm:text-xl">
            Denizli&apos;de Çocuklar için 3D Tasarım ve Baskı Atölyesi
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-on-surface-soft)] sm:text-lg">
            D2P (Düşün-Tasarla-Üret-Test Et) modeliyle; sadece teknolojiyi öğrenen değil,
            çevrelerindeki problemlere 3D tasarımlarla çözümler geliştiren ve ürettiği çözümleri
            gerçek hayatta uygulayan geleceğin mühendislerini yetiştiriyoruz.
          </p>

          <HeroCtaButtons />

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border-surface pt-8">
            <div>
              <dt className="text-2xl font-bold text-navy-950">400+</dt>
              <dd className="text-sm text-muted">Öğrenci</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-navy-950">3</dt>
              <dd className="text-sm text-muted">Etkinlik</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-navy-950">4</dt>
              <dd className="text-sm text-muted">Okul İş Birliği</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
