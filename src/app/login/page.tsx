import { Suspense } from "react";

import { LoginForm } from "@/presentation/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-600">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
