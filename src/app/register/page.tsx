import { Suspense } from "react";

import { RegisterForm } from "@/presentation/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-600">Yükleniyor...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
