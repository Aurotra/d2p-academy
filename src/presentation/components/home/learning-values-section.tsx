import type { ReactNode } from "react";

interface LearningValueCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function LearningValueCard({ icon, title, description }: LearningValueCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-200/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold text-navy-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function DesignIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" strokeLinejoin="round" />
      <path d="M4 7l8 4 8-4M12 11v10" strokeLinejoin="round" />
      <path d="m15 5-6 3" strokeLinecap="round" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 8V4h10v4" strokeLinejoin="round" />
      <rect x="4" y="8" width="16" height="9" rx="2" />
      <path d="M7 17v3h10v-3M8 12h.01M12 12h.01" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4h10a2 2 0 0 1 2 2v11H5V6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      <path d="M12 17v3l-2-1-2 1v-3" strokeLinejoin="round" />
    </svg>
  );
}

const learningValues = [
  {
    icon: <DesignIcon />,
    title: "3D Tasarım ve Modelleme",
    description:
      "Hayal gücünü dijital dünyaya aktar. Öğrencilerimize fikirlerini 3 boyutlu olarak çizmeyi ve mühendislik tasarımının temellerini öğretiyoruz.",
  },
  {
    icon: <PrinterIcon />,
    title: "Fiziksel Üretim (3D Baskı)",
    description:
      "Tasarımlarını ekranda bırakma! D2P atölyelerinde çocuklar, çizdikleri modelleri 3D yazıcılarla dokunabildikleri gerçek ürünlere dönüştürür.",
  },
  {
    icon: <GearIcon />,
    title: "Gerçek Dünya Problem Çözümü",
    description:
      "Sadece oyuncak değil, çözüm üretiyoruz. Öğrencilerimiz çevrelerindeki sorunları tespit edip, onlara mühendislik yaklaşımıyla pratik çözümler geliştirir.",
  },
  {
    icon: <CertificateIcon />,
    title: "Doğrulanabilir Başarı ve Portfolyo",
    description:
      "Tamamlanan her proje ile dijital portfolyonuzu büyütün. QR kodlu, doğrulanabilir başarı sertifikaları ile geleceğinize yatırım yapın.",
  },
] as const;

export function LearningValuesSection() {
  return (
    <section id="learning" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600">
            Eğitim Değerlerimiz
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
            D2P Academy&apos;de Neler Öğreneceksiniz?
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {learningValues.map((item) => (
            <LearningValueCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
