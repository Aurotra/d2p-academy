import type { Metadata } from "next";
import { Suspense } from "react";

import { InstructorLoginForm } from "@/presentation/components/auth/instructor-login-form";
import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Eğitmen Girişi",
};

export default function InstructorLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Yükleniyor...</div>}>
      <InstructorLoginForm />
    </Suspense>
  );
}
