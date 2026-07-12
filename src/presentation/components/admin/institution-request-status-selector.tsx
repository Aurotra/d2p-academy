"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";

export const INSTITUTION_REQUEST_STATUS_OPTIONS = [
  "yeni",
  "aranıyor",
  "teklif verildi",
  "anlaşıldı",
  "iptal",
] as const;

export type InstitutionRequestStatus = (typeof INSTITUTION_REQUEST_STATUS_OPTIONS)[number];

interface InstitutionRequestStatusSelectorProps {
  requestId: string;
  initialStatus: InstitutionRequestStatus;
}

export function InstitutionRequestStatusSelector({
  requestId,
  initialStatus,
}: InstitutionRequestStatusSelectorProps) {
  const router = useRouter();
  const [status, setStatus] = useState<InstitutionRequestStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextStatus: InstitutionRequestStatus) {
    const previousStatus = status;
    setStatus(nextStatus);
    setError(null);
    setIsUpdating(true);

    const client = createSupabaseBrowserClient();

    if (!client) {
      setStatus(previousStatus);
      setError("Bağlantı kurulamadı.");
      setIsUpdating(false);
      return;
    }

    try {
      const { error: updateError } = await client
        .from("institution_requests")
        .update({ status: nextStatus })
        .eq("id", requestId);

      if (updateError) {
        setStatus(previousStatus);
        setError(updateError.message);
      } else {
        router.refresh();
      }
    } catch (updateError) {
      setStatus(previousStatus);
      setError(updateError instanceof Error ? updateError.message : "Durum güncellenemedi.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-1">
      <select
        value={status}
        disabled={isUpdating}
        onChange={(event) => handleChange(event.target.value as InstitutionRequestStatus)}
        className="min-h-[44px] w-full min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-document-primary focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Talep durumu"
      >
        {INSTITUTION_REQUEST_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
