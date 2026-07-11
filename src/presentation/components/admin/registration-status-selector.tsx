"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";

export const REGISTRATION_STATUS_OPTIONS = [
  "yeni",
  "aranıyor",
  "kayıt tamamlandı",
  "iptal",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUS_OPTIONS)[number];

interface RegistrationStatusSelectorProps {
  registrationId: string;
  initialStatus: RegistrationStatus;
}

export function RegistrationStatusSelector({
  registrationId,
  initialStatus,
}: RegistrationStatusSelectorProps) {
  const [status, setStatus] = useState<RegistrationStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextStatus: RegistrationStatus) {
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
        .from("registrations")
        .update({ status: nextStatus })
        .eq("id", registrationId);

      if (updateError) {
        setStatus(previousStatus);
        setError(updateError.message);
      }
    } catch (updateError) {
      setStatus(previousStatus);
      setError(
        updateError instanceof Error ? updateError.message : "Durum güncellenemedi.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-1">
      <select
        value={status}
        disabled={isUpdating}
        onChange={(event) => handleChange(event.target.value as RegistrationStatus)}
        className="min-h-[44px] w-full min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-document-primary focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Kayıt durumu"
      >
        {REGISTRATION_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
