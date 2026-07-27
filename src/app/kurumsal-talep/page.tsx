import { InstitutionRequestForm } from "@/presentation/components/institution/institution-request-form";
import { InstitutionRequestGuestNote } from "@/presentation/components/institution/institution-request-guest-note";
import { institutionRequestPageMetadata } from "@/shared/seo/public-pages";

export const metadata = institutionRequestPageMetadata;

const providedServices = [
  "Eğitmen ve teknik ekip",
  "3D yazıcılar ve 3D kalemler",
  "Bilgisayar destekli eğitim materyalleri",
  "Filament ve tüm sarf malzemeleri",
  "Eğitim dokümanları, sertifikalar ve rozetler",
  "Uygulama ekipmanları",
  "Kurulum ve toplama hizmetleri",
  "Ulaşım, konaklama (gerektiğinde), yemek ve lojistik giderleri",
] as const;

const classroomRequirements = [
  "En fazla 20 öğrencilik sınıf düzeni",
  "5 takım çalışmasına uygun masa yerleşimi",
  "Her takım için çalışma alanı ve bilgisayar",
  "Eğitmen sunumu için projeksiyon",
] as const;

const electricalRequirements = [
  "Her takımın kullanabileceği elektrik erişimi",
  "Yeterli sayıda uzatma kablosu ve çoklu prizler",
  "Güvenli elektrik altyapısı",
] as const;

/**
 * Projede harici bir ikon kütüphanesi (lucide-react vb.) teyit edilemediğinden
 * mevcut tasarım diliyle uyumlu, bağımlılık gerektirmeyen inline SVG ikonlar
 * kullanıldı. Kütüphane kurulursa CheckCircleIcon → CheckCircle,
 * BuildingIcon → Building, ZapIcon → Zap, MonitorIcon → Monitor ile
 * doğrudan değiştirilebilir.
 */
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.5L10.8 14.8L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="5" y="3.5" width="10" height="17" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 9.5H19.5V20.5H15" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path
        d="M8 7.5H9.2M11.8 7.5H13M8 11H9.2M11.8 11H13M8 14.5H9.2M11.8 14.5H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 3L6 13.5H11.5L10.5 21L18 10H12.5L13 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 20H15.5M12 17V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function InstitutionRequestPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            D2P Academy
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Kurumsal Eğitim Talebi
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Özel okul, devlet okulu, belediye ve diğer kurumlar için toplu atölye / eğitim paketi
            taleplerinizi buradan iletebilirsiniz. Ekibimiz size özel teklif için dönüş yapar.
          </p>
          <InstitutionRequestGuestNote />
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <InstitutionRequestForm />
        </div>
      </div>

      {/* Kurumsal İş Birliği Modeli — bilgilendirme bölümü */}
      <div className="mx-auto mt-12 w-full max-w-4xl">
        <section aria-labelledby="institution-model-heading">
          {/* A. Üst Vurgu Kartı */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <h2 id="institution-model-heading" className="text-xl font-bold text-slate-900 sm:text-2xl">
              Kurumsal İş Birliği Modeli
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Kurumsal eğitimlerde <span className="font-semibold text-document-primary">D2P Academy</span>,
              eğitimin uygulanabilmesi için gerekli tüm teknik ekipman, eğitim materyalleri ve
              uygulama malzemelerini sağlayarak eğitimi <span className="font-semibold">anahtar teslim</span> şekilde
              gerçekleştirir.
            </p>
            <div className="mt-5 inline-flex items-start gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white sm:items-center">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
              <span>Kurumdan bu hizmetler için herhangi bir ek ücret talep edilmez.</span>
            </div>
          </div>

          {/* B. 2 Kolonlu Detay Grid'i */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kolon 1: D2P Academy Tarafından Sağlanan Hizmetler */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-document-primary/10 text-document-primary">
                  <BuildingIcon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  D2P Academy Tarafından Sağlanan Hizmetler
                </h3>
              </div>
              <ul className="mt-5 space-y-3">
                {providedServices.map((service) => (
                  <li key={service} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolon 2: Kurumdan Beklentiler */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-document-primary/10 text-document-primary">
                  <MonitorIcon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Kurumdan Beklentiler (Sınıf &amp; Altyapı)
                </h3>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <MonitorIcon className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Eğitim Ortamı
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {classroomRequirements.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Elektrik Altyapısı
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {electricalRequirements.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* C. Kapanış Notu */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-6 text-center sm:p-8">
            <p className="text-sm italic leading-7 text-slate-600 sm:text-base">
              &quot;Bu hazırlıkların tamamlanmasının ardından eğitimin uygulanmasına yönelik tüm
              süreç D2P Academy tarafından uçtan uca yürütülmektedir.&quot;
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
