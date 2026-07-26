import { Suspense } from "react";

import { EmailConfirmForm } from "@/presentation/components/auth/email-confirm-form";

export default function EmailConfirmPage() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmForm />
    </Suspense>
  );
}
