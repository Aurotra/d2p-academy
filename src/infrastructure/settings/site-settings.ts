import type { SupabaseClient } from "@supabase/supabase-js";

export const KAKLIK_CAMPAIGN_SETTING_KEY = "kaklik_campaign";

export async function isKaklikCampaignEnabled(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", KAKLIK_CAMPAIGN_SETTING_KEY)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const value = data.value as { enabled?: unknown } | null;
  return value?.enabled === true;
}

export async function setKaklikCampaignEnabled(
  client: SupabaseClient,
  enabled: boolean,
  updatedBy: string | null,
): Promise<void> {
  const { error } = await client.from("site_settings").upsert(
    {
      key: KAKLIK_CAMPAIGN_SETTING_KEY,
      value: { enabled },
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Kampanya durumu kaydedilemedi: ${error.message}`);
  }
}
