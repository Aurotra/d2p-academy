import Link from "next/link";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-cyan-200/50 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Yönetim Merkezi
        </p>
        <h2 className="mt-2 text-3xl font-black">D2P Academy Admin Paneli</h2>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/80">
          Etkinlikleri yönetin, sertifikaları oluşturun veya iptal edin. Tüm işlemler Supabase
          veritabanına API üzerinden kaydedilir.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </div>
  );
}
