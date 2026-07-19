"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { KaklikCampaignSettings } from "@/infrastructure/settings/site-settings";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";

interface KaklikCampaignToggleCardProps {
  initialSettings: KaklikCampaignSettings;
}

export function KaklikCampaignToggleCard({ initialSettings }: KaklikCampaignToggleCardProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [title, setTitle] = useState(initialSettings.title);
  const [bannerText, setBannerText] = useState(initialSettings.bannerText);
  const [description, setDescription] = useState(initialSettings.description);
  const [note, setNote] = useState(initialSettings.note);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function saveSettings(patch: Partial<KaklikCampaignSettings>) {
    const response = await fetch("/api/v1/admin/campaigns/kaklik", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = (await response.json()) as {
      error?: string;
      data?: KaklikCampaignSettings;
    };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error ?? "Kampanya ayarları kaydedilemedi.");
    }
    return payload.data;
  }

  async function toggle() {
    setIsToggling(true);
    setError(null);
    setSuccess(null);

    try {
      const next = await saveSettings({ enabled: !enabled });
      setEnabled(next.enabled);
      setSuccess(next.enabled ? "Kampanya açıldı." : "Kampanya kapatıldı.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "İşlem başarısız.");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleSaveCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const next = await saveSettings({
        title: title.trim(),
        bannerText: bannerText.trim(),
        description: description.trim(),
        note: note.trim(),
      });
      setTitle(next.title);
      setBannerText(next.bannerText);
      setDescription(next.description);
      setNote(next.note);
      setSuccess("Kampanya metinleri kaydedildi.");
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
        enabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-document-primary">
            Anasayfa Kampanyası
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{title || "Kampanya"}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Açıkken anasayfada duyuru bandı ve kayıt formu görünür. İsim ve açıklamaları buradan
            güncelleyebilirsiniz.
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
          disabled={isToggling || isSaving}
          onClick={() => void toggle()}
          className="min-h-[44px] shrink-0 px-5"
        >
          {isToggling ? "Kaydediliyor..." : enabled ? "Kampanyayı Kapat" : "Kampanyayı Aç"}
        </Button>
      </div>

      <form onSubmit={(event) => void handleSaveCopy(event)} className="mt-6 space-y-4 border-t border-slate-200/80 pt-5">
        <Input
          label="Kampanya adı"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={120}
        />
        <Textarea
          label="Duyuru bandı açıklaması"
          value={bannerText}
          onChange={(event) => setBannerText(event.target.value)}
          required
          rows={2}
          maxLength={280}
        />
        <Textarea
          label="Kayıt bölümü açıklaması"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={3}
          maxLength={500}
        />
        <Textarea
          label="Önemli not"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          required
          rows={3}
          maxLength={600}
        />
        <Button type="submit" disabled={isSaving || isToggling} className="min-h-[44px]">
          {isSaving ? "Kaydediliyor..." : "Metinleri Kaydet"}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-emerald-800">{success}</p> : null}
    </div>
  );
}
