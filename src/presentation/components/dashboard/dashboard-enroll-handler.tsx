"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Legacy /dashboard?enroll= links → child enrollment flow on the children page. */
export function DashboardEnrollHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollEventId = searchParams.get("enroll");
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enrollEventId || ranRef.current) {
      return;
    }

    ranRef.current = true;
    router.replace(
      `/dashboard/children?enroll=1&eventId=${encodeURIComponent(enrollEventId)}`,
    );
  }, [enrollEventId, router]);

  if (!enrollEventId) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
      Etkinlik kaydı için çocuk hesapları sayfasına yönlendiriliyorsunuz…
    </div>
  );
}
