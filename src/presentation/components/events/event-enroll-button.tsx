"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { Button } from "@/presentation/components/ui/button";
import {
  buildLoginForEventPath,
  buildRegisterForEventPath,
} from "@/shared/utils/event-enrollment";

interface EventEnrollButtonProps {
  eventId: string;
  className?: string;
}

type EnrollState = "idle" | "loading" | "success" | "already" | "error";

export function EventEnrollButton({ eventId, className = "" }: EventEnrollButtonProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [state, setState] = useState<EnrollState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setIsLoggedIn(false);
      return;
    }

    void client.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function enroll() {
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/v1/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: { alreadyEnrolled?: boolean; eventTitle?: string };
      };

      if (response.status === 401) {
        router.push(buildRegisterForEventPath(eventId));
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Etkinliğe kayıt olunamadı.");
      }

      if (payload.data?.alreadyEnrolled) {
        setState("already");
        setMessage("Bu etkinliğe zaten kayıtlısınız.");
        return;
      }

      setState("success");
      setMessage("Kaydınız alındı. Panelinizde görüntülenecek.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Kayıt sırasında hata oluştu.");
    }
  }

  if (isLoggedIn === null) {
    return (
      <Button disabled className={`min-h-[44px] w-full ${className}`}>
        Kontrol ediliyor...
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Link href={buildRegisterForEventPath(eventId)} className="block">
          <Button className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document">
            Etkinliğe Kaydol
          </Button>
        </Link>
        <p className="text-center text-xs leading-5 text-slate-500">
          Üye değilseniz önce{" "}
          <Link href={buildRegisterForEventPath(eventId)} className="font-semibold text-document-primary">
            hesap oluşturun
          </Link>
          ; hesabınız varsa{" "}
          <Link href={buildLoginForEventPath(eventId)} className="font-semibold text-document-primary">
            giriş yapın
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        type="button"
        disabled={state === "loading" || state === "success" || state === "already"}
        onClick={() => void enroll()}
        className="min-h-[44px] w-full bg-document-primary hover:bg-document-primary-hover hover:shadow-glow-document"
      >
        {state === "loading"
          ? "Kaydediliyor..."
          : state === "success" || state === "already"
            ? "Kayıtlı"
            : "Etkinliğe Kaydol"}
      </Button>
      {message ? (
        <p
          className={`text-center text-xs leading-5 ${
            state === "error" ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
