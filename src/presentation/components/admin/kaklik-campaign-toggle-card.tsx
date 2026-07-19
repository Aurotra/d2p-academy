"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/components/ui/button";
import { KAKLIK_CAMPAIGN_TITLE } from "@/shared/constants/kaklik-campaign";

interface KaklikCampaignToggleCardProps {
  initialEnabled: boolean;
}

export function KaklikCampaignToggleCard({ initialEnabled }: KaklikCampaignToggleCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setIsSaving(true);
    setError(null);
    const next = !enabled;

    try {
      const response = await fetch("/api/v1/admin/campaigns/kaklik", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Kampanya durumu güncellenemedi.");
      }

      setEnabled(next);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "İşlem başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className={`rounded-[1.75rem] border p-6 shadow-sm ${
        enabled
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-document-primary">
            Anasayfa Kampanyası
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{KAKLIK_CAMPAIGN_TITLE}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Açıkken anasayfada duyuru bandı ve kayıt formu görünür. Kapalıyken gizlenir; yeni
            başvuru alınmaz.
          </p>
          <p className="mt-2 text-sm font-bold">
            Durum:{" "}
            <span className={enabled ? "text-emerald-800" : "text-slate-500"}>
              {enabled ? "Aktif (kayıt alınıyor)" : "Kapalı"}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant={enabled ? "secondary" : "primary"}
          disabled={isSaving}
          onClick={() => void toggle()}
          className="min-h-[44px] shrink-0 px-5"
        >
          {isSaving ? "Kaydediliyor..." : enabled ? "Kampanyayı Kapat" : "Kampanyayı Aç"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
