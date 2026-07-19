import { Suspense } from "react";

import { StudentLoginForm } from "@/presentation/components/auth/student-login-form";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-600">Yükleniyor...</div>}>
      <StudentLoginForm />
    </Suspense>
  );
}
