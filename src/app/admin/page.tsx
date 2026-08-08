import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminPendingCounts } from "@/infrastructure/admin/get-admin-pending-counts";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

interface AdminCard {
  href: string;
  title: string;
  description: string;
  tone: string;
  badge: string;
  pendingKey?: "registrations" | "institutionRequests" | "courseDemandRequests";
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
        tone: "border-border-surface bg-surface-tint-mixed text-navy-950 hover:bg-surface-section",
        badge: "bg-surface-tint-yellow text-navy-900",
      },
      {
        href: "/admin/enrollments",
        title: "Etkinlik Kayıtları",
        description: "Hangi öğrencinin hangi etkinliğe kaydolduğunu görüntüleyin.",
        tone: "border-teal-200 bg-teal-100 text-teal-950 hover:bg-teal-50",
        badge: "bg-teal-200/70 text-teal-800",
      },
      {
        href: "/admin/forms",
        title: "Formlar",
        description: "Tanışma, onaylar ve test formlarını görüntüleyin; PDF çıktısı alın.",
        tone: "border-orange-200 bg-orange-100 text-orange-950 hover:bg-orange-50",
        badge: "bg-orange-200/70 text-orange-900",
      },
      {
        href: "/admin/certificates",
        title: "Sertifika Yönetimi",
        description: "Tamamlanan kayıtlara sertifika verin veya iptal edin.",
        tone: "border-violet-200 bg-violet-100 text-violet-950 hover:bg-violet-50",
        badge: "bg-violet-200/70 text-violet-800",
      },
      {
        href: "/admin/logs",
        title: "İşlem Logları",
        description: "Sertifika iptal nedenleri ve silinen kayıtları görüntüleyin.",
        tone: "border-border-surface bg-surface-section text-navy-950 hover:bg-surface-section",
        badge: "bg-surface-section/80 text-navy-900",
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
        tone: "border-amber-200 bg-amber-100 text-amber-950 hover:bg-amber-50",
        badge: "bg-amber-200/70 text-amber-900",
      },
      {
        href: "/admin/parents",
        title: "Veli İletişim",
        description: "Velilerin ad, e-posta ve telefon bilgilerini görüntüleyin.",
        tone: "border-border-surface bg-surface-tint-mixed text-navy-950 hover:bg-surface-section",
        badge: "bg-surface-tint-yellow text-navy-900",
      },
      {
        href: "/admin/members",
        title: "Veliler ve Üyeler",
        description: "Siteye kayıt olan veli ve üye hesaplarını listeleyin.",
        tone: "border-cyan-200 bg-cyan-100 text-cyan-950 hover:bg-cyan-50",
        badge: "bg-cyan-200/70 text-cyan-900",
      },
      {
        href: "/admin/documents",
        title: "Döküman Yönetimi",
        description: "Ödev ve ders materyallerini yükleyin, öğrencilerle paylaşın.",
        tone: "border-indigo-200 bg-indigo-100 text-indigo-950 hover:bg-indigo-50",
        badge: "bg-indigo-200/70 text-indigo-800",
      },
    ],
  },
  {
    title: "Başvurular",
    description:
      "Kurs talepleri, kurumsal eğitim başvuruları, program tanımları ve eski ön kayıt arşivi.",
    cards: [
      {
        href: "/admin/registrations",
        title: "Eski Ön Kayıtlar",
        description: "Kapatılan ön kayıt formundan gelen başvuruları arşiv olarak görüntüleyin.",
        tone: "border-lime-200 bg-lime-100 text-lime-950 hover:bg-lime-50",
        badge: "bg-lime-200/70 text-lime-900",
        pendingKey: "registrations",
      },
      {
        href: "/admin/institution-requests",
        title: "Kurumsal Talepler",
        description: "Okul ve belediye gibi kurumlardan gelen toplu eğitim taleplerini yönetin.",
        tone: "border-rose-200 bg-rose-100 text-rose-950 hover:bg-rose-50",
        badge: "bg-rose-200/70 text-rose-800",
        pendingKey: "institutionRequests",
      },
      {
        href: "/admin/course-demand",
        title: "Kurs Talepleri",
        description: "Velilerin bıraktığı program ve tarih tercihlerini gruplayıp sınıf oluşturun.",
        tone: "border-amber-200 bg-amber-100 text-amber-950 hover:bg-amber-50",
        badge: "bg-amber-200/70 text-amber-900",
        pendingKey: "courseDemandRequests",
      },
      {
        href: "/admin/programs",
        title: "Program Tanımları",
        description: "Kurs programlarının süre bilgilerini (hafta/saat) yönetin.",
        tone: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-950 hover:bg-fuchsia-50",
        badge: "bg-fuchsia-200/70 text-fuchsia-900",
      },
    ],
  },
];

export default async function AdminOverviewPage() {
  const client = await createSupabaseServerClient();
  if (!client) {
    redirect("/login");
  }

  const pendingCounts = await getAdminPendingCounts(client);

  return (
    <div className="space-y-8">
      <div
        className={`rounded-[2rem] border border-border-surface ${BRAND_SURFACE_GRADIENT} p-8 text-navy-950`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
          Yönetim Merkezi
        </p>
        <h2 className="mt-2 text-3xl font-black">D2P Academy Admin Paneli</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-on-surface-soft)]">
          Etkinlikleri, başvuruları ve öğrenci içeriklerini buradan yönetin.
        </p>
      </div>

      {pendingCounts.programsMissingDuration > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Program süre bilgisi eksik</p>
          <p className="mt-1 leading-6 text-amber-900/90">
            {pendingCounts.programsMissingDuration} aktif programda hafta/saat süresi girilmemiş (
            {pendingCounts.programsMissingDurationCodes.join(", ")}). Veli kurs talebi formunda
            otomatik tarih önerisi bu programlar için çalışmaz.{" "}
            <Link href="/admin/programs" className="font-semibold underline hover:text-amber-950">
              Program Tanımları →
            </Link>
          </p>
        </div>
      ) : null}

      {categories.map((category) => (
        <section key={category.title} className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-navy-950">{category.title}</h3>
            <p className="mt-1 text-sm text-muted">{category.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {category.cards.map((card) => {
              const pending = card.pendingKey ? pendingCounts[card.pendingKey] : 0;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group rounded-[1.75rem] border p-6 transition hover:border-secondary/40 ${card.tone}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${card.badge}`}
                    >
                      Aç
                    </span>
                    {pending > 0 ? (
                      <span className="inline-flex rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white">
                        {pending} yeni
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-3 text-xl font-black tracking-tight">{card.title}</h4>
                  <p className="mt-2 text-sm leading-6 opacity-80">{card.description}</p>
                  <p className="mt-4 text-sm font-bold opacity-90 group-hover:underline">Git →</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
