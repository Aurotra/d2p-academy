import Link from "next/link";

import { CONTACT } from "@/shared/constants/contact";
import { Button } from "@/presentation/components/ui/button";

export const metadata = {
  title: "İletişim",
  description:
    "D2P Academy iletişim bilgileri. Adres: Pamukkale Teknokent, Denizli. Telefon ve e-posta ile bize ulaşın.",
};

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.691a6.146 6.146 0 100 12.292 6.146 6.146 0 000-12.292zm0 10.155a4.009 4.009 0 110-8.018 4.009 4.009 0 010 8.018zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            D2P Academy
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">İletişim</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Atölyeler, okul iş birlikleri ve kayıt süreçleri hakkında sorularınız için bize
            ulaşabilirsiniz.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Sol: Harita + adres */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title="Pamukkale Teknokent konum haritası"
                src={CONTACT.mapsEmbedUrl}
                width="100%"
                height="280"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block w-full"
              />
            </div>

            <a
              href={CONTACT.mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
            >
              Yol Tarifi Al →
            </a>

            <div className="mt-3">
              <p className="text-base font-semibold text-slate-900">{CONTACT.organization}</p>
              <address className="mt-2 not-italic text-sm leading-6 text-slate-600">
                {CONTACT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>

          {/* Sağ: Bilgi + CTA */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Telefon
                </p>
                <a
                  href={`tel:${CONTACT.phoneTel}`}
                  className="mt-2 inline-flex min-h-[44px] items-center text-lg font-semibold text-slate-900 transition hover:text-document-primary"
                >
                  {CONTACT.phoneDisplay}
                </a>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  E-posta
                </p>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="mt-2 inline-flex min-h-[44px] items-center break-all text-lg font-semibold text-slate-900 transition hover:text-document-primary"
                >
                  {CONTACT.email}
                </a>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Instagram
                </p>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-lg font-semibold text-slate-900 transition hover:text-document-primary"
                >
                  <InstagramIcon />
                  @{CONTACT.instagramHandle}
                </a>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Çalışma Saatleri
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{CONTACT.workingHours}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-base leading-7 text-slate-700">
                Bireysel ön kayıt veya okul / belediye için kurumsal eğitim talebi oluşturabilirsiniz.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/kayit" className="sm:flex-1">
                  <Button className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document">
                    Ön Kayıt
                  </Button>
                </Link>
                <Link href="/kurumsal-talep" className="sm:flex-1">
                  <Button variant="outline" className="min-h-[44px] w-full">
                    Kurumsal Talep
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
