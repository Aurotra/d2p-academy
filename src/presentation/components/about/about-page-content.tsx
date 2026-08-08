import type { ReactNode } from "react";

import { PublicPageShell } from "@/presentation/components/layout/public-page-shell";
import {
  BRAND_ACCENT_CARD_STYLES,
  BRAND_ACCENT_ICON_STYLES,
  BRAND_SURFACE_FEATURE_CARD,
  brandAccentAt,
  type BrandAccent,
} from "@/shared/constants/brand-surfaces";

interface EducatorImageFit {
  objectPosition: string;
  scale?: number;
}

interface Educator {
  id: string;
  name: string;
  title: string;
  highlights: string[];
  image?: string;
  imageFit?: EducatorImageFit;
}

const educators: Educator[] = [
  {
    id: "berk-tepe",
    name: "Berk Tepe",
    title: "Otomotiv Mühendisi | Kurucu",
    image: "/team/berk-tepe.png",
    imageFit: { objectPosition: "50% 28%", scale: 1.1 },
    highlights: [
      "10+ yıl 2D ve 3D tasarım deneyimi",
      "5+ yıl 3D yazıcı ve dijital üretim teknolojileri deneyimi",
      "CAD modelleme, prototipleme ve üretim süreçleri konusunda uzman",
    ],
  },
  {
    id: "sude-can-sumer",
    name: "Sude Can Sümer",
    title: "Makine Mühendisi",
    image: "/team/sude-can-sumer.png",
    imageFit: { objectPosition: "50% 30%", scale: 1 },
    highlights: [
      "5+ yıl 2D ve 3D tasarım deneyimi",
      "5+ yıl 3D yazıcı ve dijital üretim teknolojileri deneyimi",
      "Dijital tasarım, prototipleme ve uygulamalı üretim teknolojileri alanında uzman",
      "Marka iletişimi, sosyal medya yönetimi ve içerik stratejisi",
    ],
  },
  {
    id: "pelin-duran",
    name: "Pelin Duran",
    title: "Fen ve Matematik Öğretmeni",
    image: "/team/pelin-duran.png",
    imageFit: { objectPosition: "42% 24%", scale: 1.2 },
    highlights: [
      "Fen Bilgisi ve İlköğretim Matematik Öğretmenliği Çift Anadal Lisans",
      "Disiplinlerarası (STEM) Eğitimi ve Uygulama Deneyimi",
      "Yaratıcı Drama ile Öğretim Uzmanlığı",
      "Zeka ve Akıl Oyunları Eğitimi Uzmanlığı",
      "Somutlaştırma ve Ürün Tasarımı Odaklı Matematik/Fen Becerileri Uzmanlığı",
      "Mantık Yürütme, Analitik Düşünme ve Problem Çözme Koçluğu Deneyimi",
    ],
  },
];

const educationAreas = [
  "Tasarım odaklı düşünme",
  "Üç boyutlu düşünme becerileri",
  "Dijital tasarım",
  "3D yazıcı teknolojileri",
  "Prototipleme",
  "Ürün geliştirme",
  "Mühendislik tasarım süreci",
  "STEM temelli uygulamalar",
  "Takım çalışması",
] as const;

const corporateParagraphs = [
  <>
    <span className="font-semibold text-document-primary">D2P Academy</span>, ATH Eğitim
    Teknolojileri Mühendislik Danışmanlık Sanayi ve Ticaret Limited Şirketi (
    <span className="font-semibold text-document-primary">ATH Mühendislik</span>) bünyesinde
    faaliyet gösteren, çocuklara ve gençlere yönelik tasarım, üretim ve teknoloji eğitimleri
    geliştiren eğitim markasıdır.
  </>,
  <>
    <span className="font-semibold text-document-primary">ATH Mühendislik</span>; mühendislik,
    eğitim teknolojileri, dijital üretim, üç boyutlu tasarım, STEM uygulamaları, danışmanlık ve
    Ar-Ge alanlarında faaliyet gösteren yenilikçi bir teknoloji şirketidir. Şirket, mühendislik
    bilgi birikimini eğitimle buluşturarak geleceğin üreten bireylerini yetiştirmeyi amaçlayan
    projeler geliştirmektedir.
  </>,
  <>
    Bu vizyonun en önemli eğitim platformu olan{" "}
    <span className="font-semibold text-document-primary">
      D2P Academy (Design to Print Academy)
    </span>
    ; çocukların ve gençlerin yalnızca teknoloji kullanan bireyler değil, aynı zamanda
    tasarlayan, üreten, problem çözen ve takım çalışması yapabilen bireyler olarak
    yetişmelerini hedeflemektedir.
  </>,
  <>
    D2P Academy bünyesinde geliştirilen eğitim programları; üç boyutlu düşünme, dijital
    tasarım, 3D yazıcı teknolojileri, üretim süreçleri, mühendislik tasarım yaklaşımı ve STEM
    temelli uygulamaları bir araya getirerek öğrencilerin öğrenme süreçlerini uygulamalı
    deneyimlerle desteklemektedir.
  </>,
  <>
    Belediyeler, okullar, kamu kurumları ve özel kuruluşlarla gerçekleştirilen iş birlikleri
    sayesinde D2P Academy, çocukları geleceğin üretim teknolojileriyle buluşturan sürdürülebilir
    eğitim programları sunmaktadır.
  </>,
] as const;

const mainParagraphs = [
  "Günümüzde birçok okul ve eğitim merkezleri robotik kodlama eğitimleri sunmaktadır. Bu eğitimler; algoritmik düşünme, elektronik sistemler ve programlama becerilerinin geliştirilmesinde önemli bir rol üstlenmektedir. D2P Academy ise bu sürecin farklı ancak tamamlayıcı bir boyutuna odaklanır.",
  "Robotik eğitimlerinde öğrenciler, çoğunlukla hazır mekanik parçaları ve elektronik bileşenleri kullanarak sistemler geliştirirken; D2P Academy'de öğrenciler, bu sistemlerin fiziksel parçalarını tasarlamayı, dijital ortamda modellemeyi, prototip üretmeyi ve ürün geliştirme süreçlerini deneyimler.",
  "Başka bir ifadeyle; Robotik eğitimleri \"Nasıl çalışır?\" sorusuna odaklanırken, D2P Academy \"Nasıl tasarlanır ve nasıl üretilir?\" sorusunun cevabını öğretir.",
  "Bu nedenle D2P Academy, robotik eğitimlerinin alternatifi değil; öğrencilerin tasarım ve üretim becerilerini geliştiren güçlü bir tamamlayıcısıdır.",
] as const;

const closingParagraph =
  "Öğrenciler yalnızca bir ürün üretmeyi değil, bir problemi analiz etmeyi, çözüm geliştirmeyi, fikirlerini prototipe dönüştürmeyi ve geliştirdikleri çözümü paylaşmayı öğrenirler. Robotik kodlama ve D2P Academy birlikte kullanıldığında öğrenciler, bir ürünün hem nasıl çalıştığını hem de nasıl tasarlanıp üretildiğini öğrenir. Bu bütüncül yaklaşım, mühendislik eğitimini daha güçlü ve anlamlı hâle getirir.";

function EducationAreaCard({ index, title }: { index: number; title: string }) {
  const accent = brandAccentAt(index);
  return (
    <article
      className={`rounded-[1.75rem] border p-6 transition hover:-translate-y-1 hover:shadow-lg ${BRAND_ACCENT_CARD_STYLES[accent]}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold ${BRAND_ACCENT_ICON_STYLES[accent]}`}
      >
        {String(index).padStart(2, "0")}
      </div>
      <h3 className="mt-5 text-base font-bold leading-snug text-navy-950 sm:text-lg">{title}</h3>
    </article>
  );
}

function getEducatorInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EducatorCard({ educator }: { educator: Educator }) {
  const initials = getEducatorInitials(educator.name);
  const imageFit = educator.imageFit ?? { objectPosition: "50% 22%", scale: 1 };
  const imageScale = Math.max(1, imageFit.scale ?? 1);

  return (
    <article className={`flex h-full flex-col overflow-hidden ${BRAND_SURFACE_FEATURE_CARD}`}>
      <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-surface-tint-yellow via-white to-surface-section">
        {educator.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={educator.image}
            alt={educator.name}
            className="h-full w-full object-cover"
            style={{
              objectPosition: imageFit.objectPosition,
              transform: imageScale > 1 ? `scale(${imageScale})` : undefined,
              transformOrigin: imageFit.objectPosition,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-surface-base to-surface-section">
            <span
              aria-hidden
              className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold text-secondary shadow-md ring-4 ring-border-surface"
            >
              {initials}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-navy-950">{educator.name}</h3>
        <p className="mt-1 text-sm font-semibold leading-snug text-secondary">{educator.title}</p>
        <ul className="mt-4 space-y-2.5">
          {educator.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2.5 text-sm leading-6 text-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * Misyon/Vizyon kartlarında kullanılan hedef ikonu.
 * Proje genelinde harici ikon kütüphanesi (lucide-react vb.) kullanılmadığından
 * mevcut tasarım diline uyması için inline SVG olarak tanımlandı.
 */
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M15.5 8.5L13.2 13.2L8.5 15.5L10.8 10.8L15.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MissionVisionCard({
  accent,
  title,
  children,
  icon,
}: {
  accent: BrandAccent;
  title: string;
  children: ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-[1.75rem] border p-8 transition hover:-translate-y-1 hover:shadow-lg ${BRAND_ACCENT_CARD_STYLES[accent]}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${BRAND_ACCENT_ICON_STYLES[accent]}`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black text-navy-950">{title}</h3>
      <div className="mt-3 text-base leading-7 text-[var(--text-on-surface-soft)]">{children}</div>
    </article>
  );
}

export function AboutPageContent() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Hakkımızda
          </p>
          <h1 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">D2P Academy</h1>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Robotik kodlamanın &quot;Nasıl çalışır?&quot; sorusuna, &quot;Nasıl tasarlanır ve
            üretilir?&quot; cevabıyla güç katan tasarım ve üretim odaklı akademi.
          </p>
        </header>

        {/* Kurumsal Bilgi & ATH Mühendislik Yapısı */}
        <section className="mt-12 max-w-3xl space-y-5" aria-labelledby="corporate-info-heading">
          <h2 id="corporate-info-heading" className="sr-only">
            Kurumsal kimliğimiz
          </h2>
          {corporateParagraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-7 text-[var(--text-on-surface-soft)] sm:text-[1.05rem] sm:leading-8">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Misyon & Vizyon Kartları */}
        <section className="mt-16" aria-labelledby="mission-vision-heading">
          <h2 id="mission-vision-heading" className="sr-only">
            Misyon ve vizyonumuz
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <MissionVisionCard accent="document" title="Misyonumuz" icon={<TargetIcon />}>
              Çocukların ve gençlerin hayal güçlerini tasarım ve üretim becerileriyle
              buluşturarak; problem çözen, sorgulayan, iş birliği yapan ve üreten bireyler
              olarak yetişmelerine katkı sağlamak.
            </MissionVisionCard>

            <MissionVisionCard accent="secondary" title="Vizyonumuz" icon={<CompassIcon />}>
              Türkiye&apos;nin tasarım ve üretim odaklı eğitim ekosistemine yön veren,
              uygulamalı teknoloji eğitimlerinde öncü ve güvenilir bir eğitim platformu olmak.
            </MissionVisionCard>
          </div>
        </section>

        {/* Eğitim Yaklaşımımız (Robotik Kodlamadan Farkı) */}
        <section className="mt-16 max-w-3xl space-y-6" aria-labelledby="about-approach">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              Eğitim Yaklaşımımız
            </p>
            <h2 id="about-approach" className="mt-2 text-2xl font-black text-navy-950 sm:text-3xl">
              Robotik kodlamadan farkımız
            </h2>
          </div>
          {mainParagraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-7 text-[var(--text-on-surface-soft)] sm:text-[1.05rem] sm:leading-8">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="education-areas-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              Eğitim Alanları
            </p>
            <h2
              id="education-areas-heading"
              className="mt-2 text-2xl font-black text-navy-950 sm:text-3xl"
            >
              D2P Academy eğitimleri şu alanları uygulamalı etkinliklerle bir araya getirir
            </h2>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {educationAreas.map((area, index) => (
              <li key={area}>
                <EducationAreaCard index={index + 1} title={area} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="closing-approach">
          <div
            className={`rounded-[2rem] border p-8 sm:p-10 ${BRAND_ACCENT_CARD_STYLES.accent}`}
          >
            <h2 id="closing-approach" className="sr-only">
              Bütüncül yaklaşım
            </h2>
            <p className="text-base leading-7 text-[var(--text-on-surface-soft)] sm:text-[1.05rem] sm:leading-8">
              {closingParagraph}
            </p>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="educators-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              Kadromuz
            </p>
            <h2 id="educators-heading" className="mt-2 text-2xl font-black text-navy-950 sm:text-3xl">
              Eğitimcilerimiz
            </h2>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {educators.map((educator) => (
              <li key={educator.id} className="h-full">
                <EducatorCard educator={educator} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicPageShell>
  );
}
