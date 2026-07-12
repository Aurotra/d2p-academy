import Link from "next/link";

import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

interface AdminCard {
  href: string;
  title: string;
  description: string;
  tone: string;
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
        tone: "border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100 hover:border-sky-400",
      },
      {
        href: "/admin/enrollments",
        title: "Etkinlik Kayıtları",
        description: "Hangi öğrencinin hangi etkinliğe kaydolduğunu görüntüleyin.",
        tone: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:border-cyan-400",
      },
      {
        href: "/admin/certificates",
        title: "Sertifika Yönetimi",
        description: "Tamamlanan kayıtlara sertifika verin veya iptal edin.",
        tone: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:border-blue-400",
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
        tone: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 hover:border-sky-400",
      },
      {
        href: "/admin/documents",
        title: "Döküman Yönetimi",
        description: "Ödev ve ders materyallerini yükleyin, öğrencilerle paylaşın.",
        tone: "border-document-primary/25 bg-gradient-to-br from-blue-50 to-sky-100 hover:border-document-primary/50",
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
        tone: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-100 hover:border-cyan-400",
      },
      {
        href: "/admin/institution-requests",
        title: "Kurumsal Talepler",
        description: "Okul ve belediye gibi kurumlardan gelen toplu eğitim taleplerini yönetin.",
        tone: "border-sky-300 bg-gradient-to-br from-sky-100 to-blue-50 hover:border-sky-500",
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
                className={`rounded-[1.75rem] border p-6 shadow-sm transition hover:shadow-lg ${card.tone}`}
              >
                <h4 className="text-lg font-bold text-navy-950">{card.title}</h4>
                <p className="mt-2 text-sm text-slate-700">{card.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
