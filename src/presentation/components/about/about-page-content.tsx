interface Educator {
  id: string;
  name: string;
  title: string;
  highlights: string[];
  image?: string;
}

const educators: Educator[] = [
  {
    id: "berk-tepe",
    name: "Berk Tepe",
    title: "Otomotiv Mühendisi | Kurucu",
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
    highlights: [
      "5+ yıl 2D ve 3D tasarım deneyimi",
      "5+ yıl 3D yazıcı ve dijital üretim teknolojileri deneyimi",
      "Dijital tasarım, prototipleme ve uygulamalı üretim teknolojileri alanında uzman",
    ],
  },
  {
    id: "pelin-duran",
    name: "Pelin Duran",
    title: "Fen ve Matematik Öğretmeni",
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

const mainParagraphs = [
  "Günümüzde birçok okul ve eğitim merkezleri robotik kodlama eğitimleri sunmaktadır. Bu eğitimler; algoritmik düşünme, elektronik sistemler ve programlama becerilerinin geliştirilmesinde önemli bir rol üstlenmektedir. D2P Academy ise bu sürecin farklı ancak tamamlayıcı bir boyutuna odaklanır.",
  "Robotik eğitimlerinde öğrenciler, çoğunlukla hazır mekanik parçaları ve elektronik bileşenleri kullanarak sistemler geliştirirken; D2P Academy'de öğrenciler, bu sistemlerin fiziksel parçalarını tasarlamayı, dijital ortamda modellemeyi, prototip üretmeyi ve ürün geliştirme süreçlerini deneyimler.",
  "Başka bir ifadeyle; Robotik eğitimleri \"Nasıl çalışır?\" sorusuna odaklanırken, D2P Academy \"Nasıl tasarlanır ve nasıl üretilir?\" sorusunun cevabını öğretir.",
  "Bu nedenle D2P Academy, robotik eğitimlerinin alternatifi değil; öğrencilerin tasarım ve üretim becerilerini geliştiren güçlü bir tamamlayıcısıdır.",
] as const;

const closingParagraph =
  "Öğrenciler yalnızca bir ürün üretmeyi değil, bir problemi analiz etmeyi, çözüm geliştirmeyi, fikirlerini prototipe dönüştürmeyi ve geliştirdikleri çözümü paylaşmayı öğrenirler. Robotik kodlama ve D2P Academy birlikte kullanıldığında öğrenciler, bir ürünün hem nasıl çalıştığını hem de nasıl tasarlanıp üretildiğini öğrenir. Bu bütüncül yaklaşım, mühendislik eğitimini daha güçlü ve anlamlı hâle getirir.";

function EducationAreaCard({ index, title }: { index: number; title: string }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-200/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sm font-bold text-sky-700">
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

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-200/40">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-sky-100 via-white to-slate-100">
        {educator.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={educator.image} alt={educator.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-sky-700 shadow-md ring-4 ring-sky-200/80"
            >
              {initials}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-navy-950">{educator.name}</h3>
        <p className="mt-1 text-sm font-semibold leading-snug text-sky-700">{educator.title}</p>
        <ul className="mt-4 space-y-2.5">
          {educator.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2.5 text-sm leading-6 text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function AboutPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Hakkımızda
          </p>
          <h1 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">Eğitim Yaklaşımımız</h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Robotik kodlamanın &quot;Nasıl çalışır?&quot; sorusuna, &quot;Nasıl tasarlanır ve
            üretilir?&quot; cevabıyla güç katan tasarım ve üretim odaklı akademi.
          </p>
        </header>

        <section className="mt-12 max-w-3xl space-y-6" aria-labelledby="about-approach">
          <h2 id="about-approach" className="sr-only">
            Eğitim yaklaşımı
          </h2>
          {mainParagraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-7 text-slate-700 sm:text-[1.05rem] sm:leading-8">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="education-areas-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
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
          <div className="rounded-[2rem] border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm sm:p-10">
            <h2 id="closing-approach" className="sr-only">
              Bütüncül yaklaşım
            </h2>
            <p className="text-base leading-7 text-slate-800 sm:text-[1.05rem] sm:leading-8">
              {closingParagraph}
            </p>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="educators-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
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
    </div>
  );
}
