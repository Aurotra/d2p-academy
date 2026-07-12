import Link from "next/link";

import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div
        className={`rounded-[2rem] border border-sky-200 ${BRAND_SURFACE_GRADIENT} p-8 text-sky-950`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Yönetim Merkezi
        </p>
        <h2 className="mt-2 text-3xl font-black">D2P Academy Admin Paneli</h2>
        <p className="mt-3 max-w-2xl text-sm text-sky-900/80">
          Etkinlikleri yönetin, sertifikaları oluşturun veya iptal edin. Tüm işlemler Supabase
          veritabanına API üzerinden kaydedilir.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/events"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Etkinlik Yönetimi</h3>
          <p className="mt-2 text-sm text-slate-600">
            Yeni eğitim/atölye ekleyin, yayınlayın veya silin.
          </p>
        </Link>
        <Link
          href="/admin/certificates"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Sertifika Yönetimi</h3>
          <p className="mt-2 text-sm text-slate-600">
            Tamamlanan kayıtlara sertifika verin veya iptal edin.
          </p>
        </Link>
        <Link
          href="/admin/students"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-document-primary/40 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Öğrenci Yönetimi</h3>
          <p className="mt-2 text-sm text-slate-600">
            Öğrenci profillerini ve tamamlanma oranlarını görüntüleyin.
          </p>
        </Link>
        <Link
          href="/admin/documents"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-document-primary/40 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Döküman Yönetimi</h3>
          <p className="mt-2 text-sm text-slate-600">
            Ödev ve ders materyallerini yükleyin, öğrencilerle paylaşın.
          </p>
        </Link>
        <Link
          href="/admin/enrollments"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-document-primary/40 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Etkinlik Kayıtları</h3>
          <p className="mt-2 text-sm text-slate-600">
            Hangi öğrencinin hangi etkinliğe kaydolduğunu görüntüleyin.
          </p>
        </Link>
        <Link
          href="/admin/registrations"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-document-primary/40 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Ön Kayıtlar</h3>
          <p className="mt-2 text-sm text-slate-600">
            Eylül dönemi ön kayıt başvurularını görüntüleyin ve durumlarını güncelleyin.
          </p>
        </Link>
        <Link
          href="/admin/institution-requests"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-document-primary/40 hover:shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy-950">Kurumsal Talepler</h3>
          <p className="mt-2 text-sm text-slate-600">
            Okul ve belediye gibi kurumlardan gelen toplu eğitim taleplerini yönetin.
          </p>
        </Link>
      </div>
    </div>
  );
}
