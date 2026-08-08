"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonLinkClasses } from "@/presentation/components/ui/button";
import { useSiteAuth } from "@/presentation/providers/site-auth-provider";
import {
  buildEventEnrollPath,
  buildLoginForEventPath,
  buildRegisterForEventPath,
} from "@/shared/utils/event-enrollment";

interface EventEnrollButtonProps {
  eventId: string;
  className?: string;
}

export function EventEnrollButton({ eventId, className = "" }: EventEnrollButtonProps) {
  const router = useRouter();
  const { isAuthResolved, isLoggedIn } = useSiteAuth();

  function startChildEnrollment() {
    router.push(buildEventEnrollPath(eventId));
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
          Etkinliğe Kaydol
        </Link>
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
        Etkinliğe Kaydol
      </Button>
      <p className="text-center text-xs leading-5 text-subtle">
        Çocuk hesabı seçerek kayıt tamamlanır; veli hesabınız etkinliğe kaydolmaz.
      </p>
    </div>
  );
}
