"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NOTICE_KEY = "d2p_enroll_notice";

type Notice = { type: "success" | "error"; text: string };

export function DashboardEnrollHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollEventId = searchParams.get("enroll");
  const ranRef = useRef(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(Boolean(enrollEventId));

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NOTICE_KEY);
      if (stored) {
        setNotice(JSON.parse(stored) as Notice);
        sessionStorage.removeItem(NOTICE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enrollEventId || ranRef.current) {
      return;
    }

    ranRef.current = true;
    setIsEnrolling(true);

    async function completeEnrollment() {
      let nextNotice: Notice;

      try {
        const response = await fetch("/api/v1/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: enrollEventId }),
        });

        const payload = (await response.json()) as {
          error?: string;
          data?: { alreadyEnrolled?: boolean; eventTitle?: string; enrollmentId?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Etkinliğe kayıt olunamadı.");
        }

        const enrollmentId = payload.data?.enrollmentId;
        if (enrollmentId) {
          setIsEnrolling(false);
          router.replace(`/dashboard/enrollments/${enrollmentId}/forms`);
          return;
        }

        const title = payload.data?.eventTitle ?? "Etkinlik";
        nextNotice = {
          type: "success",
          text: payload.data?.alreadyEnrolled
            ? `"${title}" etkinliğine zaten kayıtlısınız.`
            : `"${title}" etkinliğine kaydınız alındı. Aşağıda listeleniyor.`,
        };
      } catch (error) {
        nextNotice = {
          type: "error",
          text: error instanceof Error ? error.message : "Etkinliğe kayıt olunamadı.",
        };
      }

      try {
        sessionStorage.setItem(NOTICE_KEY, JSON.stringify(nextNotice));
      } catch {
        setNotice(nextNotice);
      }

      setIsEnrolling(false);
      router.replace("/dashboard");
      router.refresh();
    }

    void completeEnrollment();
  }, [enrollEventId, router]);

  if (isEnrolling && enrollEventId) {
    return (
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
        Etkinliğe kaydınız tamamlanıyor...
      </div>
    );
  }

  if (!notice) {
    return null;
  }

  return (
    <div
      className={`mb-6 rounded-2xl border-2 px-5 py-4 text-sm leading-6 ${
        notice.type === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-red-300 bg-red-50 text-red-800"
      }`}
      role="status"
    >
      <p className="font-bold">{notice.type === "success" ? "Etkinlik kaydı" : "Kayıt tamamlanamadı"}</p>
      <p className="mt-1">{notice.text}</p>
    </div>
  );
}
