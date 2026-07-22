import { Suspense } from "react";

import { InstructorLoginForm } from "@/presentation/components/auth/instructor-login-form";

export default function InstructorLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-600">Yükleniyor...</div>}>
      <InstructorLoginForm />
    </Suspense>
  );
}
