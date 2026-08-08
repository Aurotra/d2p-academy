import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/presentation/components/auth/login-form";
import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Veli ve Üye Girişi",
  description: "D2P Academy veli ve üye girişi.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
