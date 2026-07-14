import type { CertificateVerificationResult } from "@/core/domain/certificate-verification";
import { SITE_LOGO_SRC, SITE_NAME, SITE_TAGLINE } from "@/shared/constants/site";

function formatIssuedAt(issuedAt: Date | string | null): string {
  if (!issuedAt) return "-";
  const date = issuedAt instanceof Date ? issuedAt : new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(date);
}

export function CertificatePreview({ result }: { result: CertificateVerificationResult }) {
  if (!result.isValid) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">Sertifika bulunamadı veya geçersiz.</p>
        <p className="mt-1">
          Lütfen kodu kontrol edin. Örnek: <strong>D2P-YK-26-00100</strong> veya{" "}
          <strong>D2P-2026-1045</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold text-emerald-700">
        Sertifika doğrulandı — bu belge geçerlidir
      </p>

      <article
        className="relative overflow-hidden rounded-2xl border-2 border-sky-300 bg-gradient-to-b from-white via-sky-50/80 to-accent/15 shadow-lg shadow-sky-200/40"
        aria-label="D2P Academy sertifika görseli"
      >
        <div
          className="pointer-events-none absolute inset-3 rounded-xl border border-sky-200/80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-5 rounded-lg border border-accent/40"
          aria-hidden
        />

        <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10">
          <img
            src={SITE_LOGO_SRC}
            alt={SITE_NAME}
            className="mx-auto h-12 w-auto object-contain sm:h-14"
            decoding="async"
          />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            {SITE_TAGLINE}
          </p>

          <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Katılım Sertifikası
          </p>

          <p className="mt-5 text-sm text-slate-600">Bu belge ile onaylanır ki</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {result.holderName ?? "Öğrenci"}
          </h3>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            aşağıdaki eğitimi başarıyla tamamlamıştır:
          </p>
          <p className="mt-2 text-lg font-semibold text-sky-800 sm:text-xl">
            {result.eventTitle ?? "Eğitim"}
          </p>

          <div className="mx-auto mt-8 grid max-w-lg gap-4 border-t border-sky-200/80 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Veriliş Tarihi
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatIssuedAt(result.issuedAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sertifika Kodu
              </p>
              <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-slate-800">
                {result.certificateCode}
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-500">{SITE_NAME} · www.d2p.com.tr</p>
        </div>
      </article>
    </div>
  );
}
