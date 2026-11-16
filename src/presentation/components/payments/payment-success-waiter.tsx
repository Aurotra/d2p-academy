"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { parentEnrollmentFormsPath } from "@/shared/utils/parent-enrollment-forms-path";

interface PaymentSuccessWaiterProps {
  paymentId: string;
}

const MAX_ATTEMPTS = 45; // ~90s at 2s interval
const POLL_MS = 2000;

export function PaymentSuccessWaiter({ paymentId }: PaymentSuccessWaiterProps) {
  const router = useRouter();
  const [message, setMessage] = useState(
    "Ödemeniz doğrulanıyor, ardından formlara geçeceksiniz…",
  );
  const [timedOut, setTimedOut] = useState(false);
  const [formsHref, setFormsHref] = useState("/dashboard/children");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

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
        const studentId = json.data?.studentId ?? "";
        const enrollmentId = json.data?.enrollmentId ?? "";
        if (studentId && enrollmentId) {
          setFormsHref(parentEnrollmentFormsPath(studentId, enrollmentId));
        }

        if (status === "paid") {
          setMessage("Ödemeniz alındı. Formlara yönlendiriliyorsunuz…");
          router.replace(parentEnrollmentFormsPath(studentId, enrollmentId));
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

      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true);
        setMessage(
          "Banka onayı biraz gecikebilir. Ödeme alındıysa formları Çocuklarım sayfasından doldurmanız gerekir.",
        );
        return;
      }

      timer = window.setTimeout(poll, POLL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [paymentId, router]);

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm leading-6 text-[var(--text-on-surface-soft)]">{message}</p>
      {timedOut ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={formsHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-document-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Formlara git
          </Link>
          <Link
            href="/dashboard/children"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-surface bg-white px-5 py-2.5 text-sm font-semibold text-navy-950"
          >
            Çocuklarım
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border-surface bg-white px-5 py-2.5 text-sm font-semibold text-navy-950"
          >
            Tekrar kontrol et
          </button>
        </div>
      ) : null}
    </div>
  );
}
