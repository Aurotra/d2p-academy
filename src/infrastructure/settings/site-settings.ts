import type { SupabaseClient } from "@supabase/supabase-js";

import {
  KAKLIK_CAMPAIGN_BANNER_TEXT,
  KAKLIK_CAMPAIGN_NOTE,
  KAKLIK_CAMPAIGN_TITLE,
} from "@/shared/constants/kaklik-campaign";

export const KAKLIK_CAMPAIGN_SETTING_KEY = "kaklik_campaign";

export const KAKLIK_CAMPAIGN_DEFAULT_DESCRIPTION =
  "20 Temmuz Pazartesi başlıyoruz. Grubunuzu seçin, yerinizi ayırtın — kontenjan sınırlıdır.";

export interface KaklikCampaignSettings {
  enabled: boolean;
  title: string;
  bannerText: string;
  description: string;
  note: string;
}

export function defaultKaklikCampaignSettings(): KaklikCampaignSettings {
  return {
    enabled: false,
    title: KAKLIK_CAMPAIGN_TITLE,
    bannerText: KAKLIK_CAMPAIGN_BANNER_TEXT,
    description: KAKLIK_CAMPAIGN_DEFAULT_DESCRIPTION,
    note: KAKLIK_CAMPAIGN_NOTE,
  };
}

function asTrimmedString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function parseKaklikCampaignSettings(raw: unknown): KaklikCampaignSettings {
  const defaults = defaultKaklikCampaignSettings();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const value = raw as Record<string, unknown>;
  return {
    enabled: value.enabled === true,
    title: asTrimmedString(value.title, defaults.title),
    bannerText: asTrimmedString(value.bannerText, defaults.bannerText),
    description: asTrimmedString(value.description, defaults.description),
    note: asTrimmedString(value.note, defaults.note),
  };
}

export async function getKaklikCampaignSettings(
  client: SupabaseClient,
): Promise<KaklikCampaignSettings> {
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", KAKLIK_CAMPAIGN_SETTING_KEY)
    .maybeSingle();

  if (error || !data) {
    return defaultKaklikCampaignSettings();
  }

  return parseKaklikCampaignSettings(data.value);
}

export async function isKaklikCampaignEnabled(client: SupabaseClient): Promise<boolean> {
  const settings = await getKaklikCampaignSettings(client);
  return settings.enabled;
}

export async function saveKaklikCampaignSettings(
  client: SupabaseClient,
  patch: Partial<KaklikCampaignSettings>,
  updatedBy: string | null,
): Promise<KaklikCampaignSettings> {
  const current = await getKaklikCampaignSettings(client);
  const next: KaklikCampaignSettings = {
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
    title: asTrimmedString(patch.title ?? current.title, current.title),
    bannerText: asTrimmedString(patch.bannerText ?? current.bannerText, current.bannerText),
    description: asTrimmedString(patch.description ?? current.description, current.description),
    note: asTrimmedString(patch.note ?? current.note, current.note),
  };

  if (!next.title) {
    throw new Error("Kampanya adı zorunludur.");
  }
  if (!next.bannerText) {
    throw new Error("Duyuru metni zorunludur.");
  }

  const { error } = await client.from("site_settings").upsert(
    {
      key: KAKLIK_CAMPAIGN_SETTING_KEY,
      value: next,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Kampanya ayarları kaydedilemedi: ${error.message}`);
  }

  return next;
}

/** @deprecated Use saveKaklikCampaignSettings */
export async function setKaklikCampaignEnabled(
  client: SupabaseClient,
  enabled: boolean,
  updatedBy: string | null,
): Promise<void> {
  await saveKaklikCampaignSettings(client, { enabled }, updatedBy);
}
