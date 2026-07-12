import Link from "next/link";

import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

interface AdminCard {
  href: string;
  title: string;
  description: string;
  /** Solid-ish card surface + text colors */
  tone: string;
  badge: string;
}

interface AdminCategory {
  title: string;
  description: string;
  cards: AdminCard[];
}

const categories: AdminCategory[] = [
  {
    title: "Etkinlikler",
    description: "Atölye ve eğitimleri yönetin, kayıtları ve sertifikaları takip edin.",
    cards: [
      {
        href: "/admin/events",
        title: "Etkinlik Yönetimi",
        description: "Yeni eğitim/atölye ekleyin, yayınlayın veya silin.",
        tone: "border-sky-400 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-sky-300/50 hover:shadow-sky-400/60",
        badge: "bg-white/25 text-white",
      },
      {
        href: "/admin/enrollments",
        title: "Etkinlik Kayıtları",
        description: "Hangi öğrencinin hangi etkinliğe kaydolduğunu görüntüleyin.",
        tone: "border-cyan-400 bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white shadow-cyan-300/50 hover:shadow-cyan-400/60",
        badge: "bg-white/25 text-white",
      },
      {
        href: "/admin/certificates",
        title: "Sertifika Yönetimi",
        description: "Tamamlanan kayıtlara sertifika verin veya iptal edin.",
        tone: "border-violet-400 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-violet-300/50 hover:shadow-violet-400/60",
        badge: "bg-white/25 text-white",
      },
    ],
  },
  {
    title: "Öğrenciler & İçerik",
    description: "Öğrenci profilleri ve paylaşılan ders materyalleri.",
    cards: [
      {
        href: "/admin/students",
        title: "Öğrenci Yönetimi",
        description: "Öğrenci profillerini ve tamamlanma oranlarını görüntüleyin.",
        tone: "border-amber-400 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-amber-300/50 hover:shadow-amber-400/60",
        badge: "bg-white/25 text-white",
      },
      {
        href: "/admin/documents",
        title: "Döküman Yönetimi",
        description: "Ödev ve ders materyallerini yükleyin, öğrencilerle paylaşın.",
        tone: "border-blue-500 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 text-white shadow-blue-300/50 hover:shadow-blue-400/60",
        badge: "bg-white/25 text-white",
      },
    ],
  },
  {
    title: "Başvurular",
    description: "Bireysel ön kayıtlar ve kurumsal eğitim talepleri.",
    cards: [
      {
        href: "/admin/registrations",
        title: "Ön Kayıtlar",
        description: "Eylül dönemi ön kayıt başvurularını görüntüleyin ve durumlarını güncelleyin.",
        tone: "border-lime-400 bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600 text-white shadow-lime-300/50 hover:shadow-lime-400/60",
        badge: "bg-white/25 text-white",
      },
      {
        href: "/admin/institution-requests",
        title: "Kurumsal Talepler",
        description: "Okul ve belediye gibi kurumlardan gelen toplu eğitim taleplerini yönetin.",
        tone: "border-rose-400 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white shadow-rose-300/50 hover:shadow-rose-400/60",
        badge: "bg-white/25 text-white",
      },
    ],
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <div
        className={`rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Yönetim Merkezi
        </p>
        <h2 className="mt-2 text-3xl font-black">D2P Academy Admin Paneli</h2>
        <p className="mt-3 max-w-2xl text-sm text-sky-900/80">
          Etkinlikleri, başvuruları ve öğrenci içeriklerini buradan yönetin.
        </p>
      </div>

      {categories.map((category) => (
        <section key={category.title} className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-navy-950">{category.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{category.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {category.cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group rounded-[1.75rem] border-2 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${card.tone}`}
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${card.badge}`}
                >
                  Aç
                </span>
                <h4 className="mt-3 text-xl font-black tracking-tight">{card.title}</h4>
                <p className="mt-2 text-sm leading-6 text-white/90">{card.description}</p>
                <p className="mt-4 text-sm font-bold text-white/95 group-hover:underline">
                  Git →
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
