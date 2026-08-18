"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { EventPaymentMode } from "@/core/domain/event";
import {
  eventEnrollCtaLabel,
  EXTERNAL_PAYMENT_NOTE,
  resolveEventPaymentMode,
} from "@/infrastructure/events/event-payment-mode";
import { Button, buttonLinkClasses } from "@/presentation/components/ui/button";
import { useSiteAuth } from "@/presentation/providers/site-auth-provider";
import {
  buildLoggedInEventEnrollPath,
  buildLoginForEventPath,
  buildRegisterForEventPath,
} from "@/shared/utils/event-enrollment";

interface EventEnrollButtonProps {
  eventId: string;
  className?: string;
  paymentMode?: EventPaymentMode;
  /** @deprecated Prefer paymentMode. Kept for backward-compatible callers. */
  isPaid?: boolean;
  compact?: boolean;
}

export function EventEnrollButton({
  eventId,
  className = "",
  paymentMode,
  isPaid = false,
  compact = false,
}: EventEnrollButtonProps) {
  const router = useRouter();
  const { isAuthResolved, isLoggedIn, userRole, sessionKind, isInstructor } = useSiteAuth();
  const mode = resolveEventPaymentMode({ paymentMode, isPaid });
  const ctaLabel = eventEnrollCtaLabel(mode);
  const showExternalNote = mode === "external";
  const isStaffSession =
    sessionKind === "email" &&
    (userRole === "admin" ||
      userRole === "instructor" ||
      (isInstructor && userRole !== "parent" && userRole !== "student"));

  function startChildEnrollment() {
    router.push(
      buildLoggedInEventEnrollPath(eventId, {
        sessionKind,
        userRole,
        isInstructor,
      }),
    );
  }

  if (!isAuthResolved) {
    return (
      <Button disabled className={`min-h-[44px] w-full ${className}`}>
        Kontrol ediliyor...
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Link
          href={buildRegisterForEventPath(eventId)}
          className={buttonLinkClasses(
            "primary",
            "min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document",
          )}
        >
          {ctaLabel}
        </Link>
        {showExternalNote ? (
          <p className="text-center text-xs leading-5 text-subtle">{EXTERNAL_PAYMENT_NOTE}</p>
        ) : null}
        {!compact ? (
          <p className="text-center text-xs leading-5 text-subtle">
            Üye değilseniz önce{" "}
            <Link href={buildRegisterForEventPath(eventId)} className="font-semibold text-document-primary">
              veli hesabı oluşturun
            </Link>
            ; hesabınız varsa{" "}
            <Link href={buildLoginForEventPath(eventId)} className="font-semibold text-document-primary">
              giriş yapın
            </Link>
            . Kayıt çocuğunuzun hesabı üzerinden tamamlanır.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        type="button"
        onClick={startChildEnrollment}
        className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        {ctaLabel}
      </Button>
      {showExternalNote ? (
        <p className="text-center text-xs leading-5 text-subtle">{EXTERNAL_PAYMENT_NOTE}</p>
      ) : null}
      {!compact && !isStaffSession ? (
        <p className="text-center text-xs leading-5 text-subtle">
          Çocuk hesabı seçerek kayıt tamamlanır; veli hesabınız etkinliğe kaydolmaz.
        </p>
      ) : null}
    </div>
  );
}
