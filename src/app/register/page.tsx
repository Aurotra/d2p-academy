import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/presentation/components/auth/register-form";
import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Hesap Oluştur",
  description: "D2P Academy veli hesabı oluşturma.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-600">Yükleniyor...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
