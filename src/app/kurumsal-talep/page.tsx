import Link from "next/link";

import { InstitutionRequestForm } from "@/presentation/components/institution/institution-request-form";

export const metadata = {
  title: "Kurumsal Eğitim Talebi",
  description:
    "Okul, belediye ve kurumlar için D2P Academy toplu eğitim paketi ve atölye organizasyonu talebi.",
};

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
          <p className="mt-3 text-sm text-slate-500">
            Bireysel öğrenci için{" "}
            <Link href="/kayit" className="font-semibold text-document-primary hover:underline">
              Eylül Dönemi Ön Kaydı
            </Link>
            ; panel üyeliği için{" "}
            <Link href="/register" className="font-semibold text-document-primary hover:underline">
              hesap oluşturun
            </Link>
            .
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <InstitutionRequestForm />
        </div>
      </div>
    </div>
  );
}
