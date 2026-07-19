import { BRAND_SURFACE_GRADIENT } from "@/shared/constants/brand-surfaces";
import {
  KAKLIK_CAMPAIGN_NOTE,
  KAKLIK_CAMPAIGN_TITLE,
  KAKLIK_TIME_GROUPS,
} from "@/shared/constants/kaklik-campaign";
import { KaklikCampaignRegistrationForm } from "@/presentation/components/home/kaklik-campaign-registration-form";

export function KaklikRegistrationSection() {
  return (
    <section
      id="kaklik-kayit"
      className={`scroll-mt-24 ${BRAND_SURFACE_GRADIENT} px-4 py-16 sm:px-6 lg:px-8`}
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <p className="inline-flex rounded-full border border-sky-400 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-900">
            Acil Kayıt
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-navy-950 sm:text-4xl">
            {KAKLIK_CAMPAIGN_TITLE}
          </h2>
          <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-sky-950/85">
            20 Temmuz Pazartesi başlıyoruz. Grubunuzu seçin, yerinizi ayırtın — kontenjan
            sınırlıdır.
          </p>

          <ul className="mt-6 space-y-2">
            {KAKLIK_TIME_GROUPS.map((group) => (
              <li
                key={group.value}
                className="rounded-xl border border-sky-300/70 bg-white/70 px-4 py-3 text-sm font-bold text-navy-950"
              >
                {group.label}
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950">
            {KAKLIK_CAMPAIGN_NOTE}
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-sky-300/80 bg-white p-6 shadow-lg sm:p-8">
          <h3 className="text-xl font-black text-navy-950">Kayıt Formu</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Ad soyad, e-posta, telefon ve eğitim saatinizi girin.
          </p>
          <div className="mt-6">
            <KaklikCampaignRegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
