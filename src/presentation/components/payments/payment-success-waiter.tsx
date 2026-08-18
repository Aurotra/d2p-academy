"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { parentEnrollmentFormsPath } from "@/shared/utils/parent-enrollment-forms-path";

interface PaymentSuccessWaiterProps {
  paymentId: string;
}

export function PaymentSuccessWaiter({ paymentId }: PaymentSuccessWaiterProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Ödemeniz doğrulanıyor, ardından formlara geçeceksiniz…");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(`/api/v1/payments/${paymentId}/status`, {
          cache: "no-store",
        });
        const json = (await response.json()) as {
          data?: { status?: string; enrollmentId?: string; studentId?: string };
        };
        if (cancelled) {
          return;
        }

        const status = json.data?.status;
        if (status === "paid") {
          setMessage("Ödemeniz alındı. Formlara yönlendiriliyorsunuz…");
          router.replace(
            parentEnrollmentFormsPath(json.data?.studentId ?? "", json.data?.enrollmentId ?? ""),
          );
          return;
        }
        if (status === "failed" || status === "cancelled") {
          router.replace(`/odeme/basarisiz?paymentId=${encodeURIComponent(paymentId)}`);
          return;
        }
      } catch {
        if (!cancelled) {
          setMessage("Ödeme sonucu bekleniyor…");
        }
      }

      if (attempts >= 20) {
        setMessage(
          "Ödeme bankadan henüz düşmemiş olabilir. Birkaç saniye sonra Çocuklarım sayfasından kontrol edebilirsiniz.",
        );
        return;
      }

      window.setTimeout(poll, 2000);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId, router]);

  return (
    <p className="mt-3 text-sm leading-6 text-[var(--text-on-surface-soft)]">{message}</p>
  );
}
