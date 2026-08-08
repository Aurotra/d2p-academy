import type { ReactNode } from "react";

type LearningValueAccent = "document" | "accent" | "primary" | "secondary";

interface LearningValueCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accent: LearningValueAccent;
}

const accentStyles: Record<
  LearningValueAccent,
  { card: string; glow: string; icon: string }
> = {
  document: {
    card: "border-document-primary/25 bg-gradient-to-br from-white via-surface-tint-mixed to-document-primary/10 shadow-lg shadow-document-primary/15 hover:border-document-primary/40 hover:shadow-glow-document",
    glow: "bg-document-primary/30",
    icon: "bg-document-primary/15 text-document-primary",
  },
  accent: {
    card: "border-accent-dark/25 bg-gradient-to-br from-white via-amber-50/70 to-accent/25 shadow-lg shadow-accent/20 hover:border-accent-dark/40 hover:shadow-glow-accent",
    glow: "bg-accent/40",
    icon: "bg-accent/25 text-accent-dark",
  },
  primary: {
    card: "border-primary/25 bg-gradient-to-br from-white via-rose-50/70 to-primary/10 shadow-lg shadow-primary/15 hover:border-primary/40 hover:shadow-glow-primary",
    glow: "bg-primary/30",
    icon: "bg-primary/15 text-primary",
  },
  secondary: {
    card: "border-secondary/25 bg-gradient-to-br from-white via-teal-50/70 to-secondary/10 shadow-lg shadow-secondary/15 hover:border-secondary/40 hover:shadow-glow-secondary",
    glow: "bg-secondary/30",
    icon: "bg-secondary/15 text-secondary",
  },
};

function LearningValueCard({ icon, title, description, accent }: LearningValueCardProps) {
  const styles = accentStyles[accent];

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] border p-6 transition hover:-translate-y-1 ${styles.card}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full blur-3xl ${styles.glow} opacity-60`}
      />
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
        {icon}
      </div>
      <h3 className="relative mt-5 text-lg font-bold text-navy-950">{title}</h3>
      <p className="relative mt-3 text-sm leading-6 text-muted">{description}</p>
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
    accent: "document" as const,
    icon: <DesignIcon />,
    title: "3D Tasarım ve Modelleme",
    description:
      "Hayal gücünü dijital dünyaya aktar. Öğrencilerimize fikirlerini 3 boyutlu olarak çizmeyi ve mühendislik tasarımının temellerini öğretiyoruz.",
  },
  {
    accent: "accent" as const,
    icon: <PrinterIcon />,
    title: "Fiziksel Üretim (3D Baskı)",
    description:
      "Tasarımlarını ekranda bırakma! D2P atölyelerinde çocuklar, çizdikleri modelleri 3D yazıcılarla dokunabildikleri gerçek ürünlere dönüştürür.",
  },
  {
    accent: "primary" as const,
    icon: <GearIcon />,
    title: "Gerçek Dünya Problem Çözümü",
    description:
      "Sadece oyuncak değil, çözüm üretiyoruz. Öğrencilerimiz çevrelerindeki sorunları tespit edip, onlara mühendislik yaklaşımıyla pratik çözümler geliştirir.",
  },
  {
    accent: "secondary" as const,
    icon: <CertificateIcon />,
    title: "Doğrulanabilir Başarı ve Portfolyo",
    description:
      "Tamamlanan her proje ile dijital portfolyonuzu büyütün. QR kodlu, doğrulanabilir başarı sertifikaları ile geleceğinize yatırım yapın.",
  },
] as const;

export function LearningValuesSection() {
  return (
    <section id="learning" className="bg-surface-section px-4 pb-12 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Eğitim Değerlerimiz
          </p>
          <h2 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
            D2P Academy&apos;de Neler Öğreneceksiniz?
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {learningValues.map((item) => (
            <LearningValueCard
              key={item.title}
              accent={item.accent}
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
