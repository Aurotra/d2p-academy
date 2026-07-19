import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import {
  getKaklikCampaignSettings,
  saveKaklikCampaignSettings,
  type KaklikCampaignSettings,
} from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Bağlantı kurulamadı." }, { status: 500 });
  }

  const settings = await getKaklikCampaignSettings(client);
  return NextResponse.json({ data: settings });
}

export async function PATCH(request: Request) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  try {
    const body = (await request.json()) as Partial<KaklikCampaignSettings>;
    const patch: Partial<KaklikCampaignSettings> = {};

    if (typeof body.enabled === "boolean") {
      patch.enabled = body.enabled;
    }
    if (typeof body.title === "string") {
      patch.title = body.title;
    }
    if (typeof body.bannerText === "string") {
      patch.bannerText = body.bannerText;
    }
    if (typeof body.description === "string") {
      patch.description = body.description;
    }
    if (typeof body.note === "string") {
      patch.note = body.note;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
    }

    const {
      data: { user },
    } = await access.client.auth.getUser();

    const settings = await saveKaklikCampaignSettings(
      access.client,
      patch,
      user?.id ?? null,
    );

    return NextResponse.json({ data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kampanya ayarları güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
