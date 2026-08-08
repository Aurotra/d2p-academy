import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentLoginForm } from "@/presentation/components/auth/student-login-form";
import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const metadata: Metadata = {
  ...NO_INDEX_METADATA,
  title: "Öğrenci Girişi",
  description: "D2P Academy öğrenci girişi.",
};

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Yükleniyor...</div>}>
      <StudentLoginForm />
    </Suspense>
  );
}
