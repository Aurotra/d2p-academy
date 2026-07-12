import Link from "next/link";

import { CONTACT } from "@/shared/constants/contact";
import { Button } from "@/presentation/components/ui/button";

export const metadata = {
  title: "İletişim",
  description:
    "D2P Academy iletişim bilgileri. Adres: Pamukkale Teknokent, Denizli. Telefon ve e-posta ile bize ulaşın.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            D2P Academy
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">İletişim</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Atölyeler, okul iş birlikleri ve kayıt süreçleri hakkında sorularınız için bize
            ulaşabilirsiniz.
          </p>
        </div>

        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Adres
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{CONTACT.organization}</p>
            <address className="mt-2 not-italic text-base leading-7 text-slate-700">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-document-primary transition hover:text-document-primary-hover"
            >
              Haritada aç
            </a>
          </div>

          <div className="border-t border-slate-100 pt-6">
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

          <div className="border-t border-slate-100 pt-6">
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

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <Link href="/kayit" className="sm:flex-1">
              <Button className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document">
                Ön Kayıt Ol
              </Button>
            </Link>
            <a href={`tel:${CONTACT.phoneTel}`} className="sm:flex-1">
              <Button variant="outline" className="min-h-[44px] w-full">
                Hemen Ara
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
