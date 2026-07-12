"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EnrollmentStatus } from "@/core/domain/student-dashboard";
import { Button } from "@/presentation/components/ui/button";

interface EnrollmentCompleteButtonProps {
  enrollmentId: string;
  status: EnrollmentStatus;
}

export function EnrollmentCompleteButton({
  enrollmentId,
  status,
}: EnrollmentCompleteButtonProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "completed") {
    return (
      <span className="text-xs font-semibold text-emerald-700">Sertifikaya hazır</span>
    );
  }

  if (status === "cancelled" || status === "no_show") {
    return null;
  }

  async function markCompleted() {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status: "completed" }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Durum güncellenemedi.");
      }

      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "İşlem başarısız.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="secondary"
        disabled={isUpdating}
        onClick={() => void markCompleted()}
        className="min-h-[40px] px-3 py-2 text-xs"
      >
        {isUpdating ? "Kaydediliyor..." : "Tamamlandı işaretle"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
